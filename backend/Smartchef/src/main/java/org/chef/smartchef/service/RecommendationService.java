package org.chef.smartchef.service;

import org.chef.smartchef.entity.Recipe;
import org.chef.smartchef.mapper.RecipeMapper;
import org.chef.smartchef.mapper.UserRecordMapper;
import org.chef.smartchef.vo.RecommendVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;


/**
 * 个性化推荐服务
 * 核心流程：
 * 1. 根据用户收藏(权重2)和浏览记录(权重1)计算各标签偏好分
 * 2. 按标签偏好分比例分配推荐数量（共100条）
 * 3. 从数据库筛选候选食谱（300条），按标签分组排序
 * 4. 去重后取出前100条，不足则用热门食谱补充
 * 5. 结果缓存30分钟，生成个性化推荐理由
 *
 * 特殊处理：
 * - "热菜"标签降权50%，避免推荐过泛
 * - 排除用户已操作过的食谱（收藏/浏览/不喜欢）
 * - 推荐理由根据标签类型生成（口味类、菜系类、工艺类）
 */


@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    @Autowired
    private RecipeMapper recipeMapper;

    @Autowired
    private UserRecordMapper userRecordMapper;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // 总推荐数量（缓存的数量）
    private static final int TOP_RECOMMEND_LIMIT = 100;

    // 候选集大小
    private static final int CANDIDATE_LIMIT = 300;

    // Redis 缓存过期时间（分钟）
    private static final int CACHE_EXPIRE_MINUTES = 30;

    //获取个性化推荐（主入口）
    public List<RecommendVO> getRecommend(Integer userId, Integer page, Integer pageSize) {
        String cacheKey = "recommend:" + userId;

        // 从 Redis 获取缓存的推荐ID列表
        List<Integer> cachedIds = getCachedRecommendIdsFromRedis(cacheKey);

        if (cachedIds != null && !cachedIds.isEmpty()) {
            log.info("命中推荐缓存: userId={}, page={}", userId, page);
            return getRecommendFromCache(cachedIds, userId, page, pageSize);
        }

        log.info("缓存未命中，重新计算推荐: userId={}", userId);
        List<RecommendVO> recommendList = calculateRecommendation(userId);

        if (!recommendList.isEmpty()) {
            List<Integer> idsToCache = recommendList.stream()
                    .limit(TOP_RECOMMEND_LIMIT)
                    .map(RecommendVO::getRecipeId)
                    .collect(Collectors.toList());
            // 存入 Redis
            cacheRecommendIdsToRedis(cacheKey, idsToCache);
        }

        return paginate(recommendList, page, pageSize);
    }

    //从 Redis 获取缓存的推荐ID列表
    private List<Integer> getCachedRecommendIdsFromRedis(String cacheKey) {
        Long size = redisTemplate.opsForList().size(cacheKey);
        if (size == null || size == 0) {
            return null;
        }
        List<Object> objects = redisTemplate.opsForList().range(cacheKey, 0, -1);
        if (objects == null || objects.isEmpty()) {
            return null;
        }
        List<Integer> ids = new ArrayList<>();
        for (Object obj : objects) {
            if (obj instanceof Integer) {
                ids.add((Integer) obj);
            } else if (obj instanceof String) {
                ids.add(Integer.parseInt((String) obj));
            }
        }
        return ids;
    }

    //缓存推荐ID列表到 Redis
    private void cacheRecommendIdsToRedis(String cacheKey, List<Integer> ids) {
        redisTemplate.delete(cacheKey);
        if (ids != null && !ids.isEmpty()) {
            for (Integer id : ids) {
                redisTemplate.opsForList().rightPush(cacheKey, id);
            }
            redisTemplate.expire(cacheKey, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        }
    }

    //从缓存获取推荐（分页）
    private List<RecommendVO> getRecommendFromCache(List<Integer> cachedIds, Integer userId,
                                                    Integer page, Integer pageSize) {
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, cachedIds.size());

        if (start >= cachedIds.size()) {
            return new ArrayList<>();
        }

        List<Integer> pageIds = cachedIds.subList(start, end);

        List<Recipe> recipes = recipeMapper.selectRecipesByIds(pageIds);

        Map<Integer, Recipe> recipeMap = recipes.stream()
                .collect(Collectors.toMap(Recipe::getRecipeId, r -> r));

        Map<String, Integer> tagStats = getUserTagStatsFromRedis(userId);

        List<RecommendVO> result = new ArrayList<>();
        for (Integer id : pageIds) {
            Recipe recipe = recipeMap.get(id);
            if (recipe != null) {
                RecommendVO vo = convertToRecommendVO(recipe);
                String bestTag = getBestMatchTag(recipe, tagStats);
                vo.setRecommendReason(getRecommendReasonByTag(bestTag));
                vo.setMatchedTag(bestTag);
                result.add(vo);
            }
        }

        return result;
    }

    //计算推荐（按权重比例分配）
    private List<RecommendVO> calculateRecommendation(Integer userId) {
        // 获取用户标签统计
        Map<String, Integer> tagStats = getUserTagStatsFromRedis(userId);

        if (tagStats.isEmpty()) {
            log.info("用户没有偏好标签，返回热门推荐");
            return getHotRecommendation(userId);
        }

        log.info("用户标签统计: {}", tagStats);

        //按权重比例计算每个标签的推荐数量
        int totalWeight = tagStats.values().stream().mapToInt(Integer::intValue).sum();
        Map<String, Integer> tagAllocation = new LinkedHashMap<>();

        for (Map.Entry<String, Integer> entry : tagStats.entrySet()) {
            String tag = entry.getKey();
            int weight = entry.getValue();

            // 按比例计算推荐数量
            int count = (int) Math.round((double) weight / totalWeight * TOP_RECOMMEND_LIMIT);
            // 至少推荐1条
            if (count == 0 && weight > 0) {
                count = 1;
            }
            tagAllocation.put(tag, count);
        }

        //调整总数，确保总和等于 TOP_RECOMMEND_LIMIT
        int totalAllocated = tagAllocation.values().stream().mapToInt(Integer::intValue).sum();
        int diff = TOP_RECOMMEND_LIMIT - totalAllocated;

        if (diff > 0) {
            List<Map.Entry<String, Integer>> sorted = new ArrayList<>(tagAllocation.entrySet());
            sorted.sort((a, b) -> tagStats.get(b.getKey()) - tagStats.get(a.getKey()));
            for (Map.Entry<String, Integer> entry : sorted) {
                if (diff <= 0) break;
                entry.setValue(entry.getValue() + 1);
                diff--;
            }
        } else if (diff < 0) {
            List<Map.Entry<String, Integer>> sorted = new ArrayList<>(tagAllocation.entrySet());
            sorted.sort((a, b) -> tagStats.get(a.getKey()) - tagStats.get(b.getKey()));
            int excess = -diff;
            for (Map.Entry<String, Integer> entry : sorted) {
                if (excess <= 0) break;
                int reduce = Math.min(entry.getValue() - 1, excess);
                if (reduce > 0) {
                    entry.setValue(entry.getValue() - reduce);
                    excess -= reduce;
                }
            }
        }

        log.info("标签分配结果: {}", tagAllocation);

        // 获取排除的食谱ID
        Set<Integer> excludedIds = userRecordMapper.getExcludedRecipeIds(userId);

        //获取所有偏好标签的候选食谱
        List<String> allPreferredTags = new ArrayList<>(tagStats.keySet());
        List<Recipe> candidates = recipeMapper.selectByTags(allPreferredTags, excludedIds, CANDIDATE_LIMIT);

        // 按标签分组
        Map<String, List<Recipe>> recipesByTag = new HashMap<>();
        for (Recipe recipe : candidates) {
            List<String> tags = recipe.getGeneralTags();
            if (tags != null) {
                for (String tag : tags) {
                    if (tagStats.containsKey(tag)) {
                        recipesByTag.computeIfAbsent(tag, k -> new ArrayList<>()).add(recipe);
                    }
                }
            }
        }

        // 按分配数量为每个标签选取食谱
        List<Recipe> selectedRecipes = new ArrayList<>();
        Set<Integer> selectedIds = new HashSet<>();

        List<Map.Entry<String, Integer>> sortedTags = new ArrayList<>(tagAllocation.entrySet());
        sortedTags.sort((a, b) -> tagStats.get(b.getKey()) - tagStats.get(a.getKey()));

        for (Map.Entry<String, Integer> entry : sortedTags) {
            String tag = entry.getKey();
            int limit = entry.getValue();

            List<Recipe> tagRecipes = recipesByTag.getOrDefault(tag, new ArrayList<>());

            tagRecipes.sort((a, b) -> {
                int scoreA = getTagScoreForRecipe(a, tag, tagStats);
                int scoreB = getTagScoreForRecipe(b, tag, tagStats);
                return scoreB - scoreA;
            });

            int count = 0;
            for (Recipe recipe : tagRecipes) {
                if (count >= limit) break;
                if (!selectedIds.contains(recipe.getRecipeId())) {
                    selectedRecipes.add(recipe);
                    selectedIds.add(recipe.getRecipeId());
                    count++;
                }
            }
        }

        // 如果数量不足，用热门食谱补充
        if (selectedRecipes.size() < TOP_RECOMMEND_LIMIT) {
            List<Recipe> hotRecipes = recipeMapper.selectHotRecipes(excludedIds, 100);
            for (Recipe recipe : hotRecipes) {
                if (!selectedIds.contains(recipe.getRecipeId())) {
                    selectedRecipes.add(recipe);
                    selectedIds.add(recipe.getRecipeId());
                    if (selectedRecipes.size() >= TOP_RECOMMEND_LIMIT) break;
                }
            }
        }

        //转换为 VO
        List<RecommendVO> result = new ArrayList<>();
        for (Recipe recipe : selectedRecipes) {
            RecommendVO vo = convertToRecommendVO(recipe);
            String bestTag = getBestMatchTag(recipe, tagStats);
            vo.setRecommendReason(getRecommendReasonByTag(bestTag));
            vo.setMatchedTag(bestTag);
            result.add(vo);
        }

        log.info("推荐计算完成，共 {} 条", result.size());
        return result;
    }

    //获取食谱针对特定标签的分数
    private int getTagScoreForRecipe(Recipe recipe, String targetTag, Map<String, Integer> tagStats) {
        List<String> tags = recipe.getGeneralTags();
        if (tags != null && tags.contains(targetTag)) {
            return tagStats.getOrDefault(targetTag, 0);
        }
        return 0;
    }

    //获取食谱匹配分最高的标签
    private String getBestMatchTag(Recipe recipe, Map<String, Integer> tagStats) {
        List<String> tags = recipe.getGeneralTags();
        if (tags == null || tags.isEmpty()) {
            return null;
        }

        List<String> scoredTags = new ArrayList<>();
        List<Integer> scores = new ArrayList<>();

        for (String tag : tags) {
            int score = tagStats.getOrDefault(tag, 0);
            if (score > 0) {
                // 对"热菜"标签降权，权重降低到原来的30%
                if (tag.equals("热菜")) {
                    score = (int)(score * 0.3);
                }
                scoredTags.add(tag);
                scores.add(score);
            }
        }

        if (scoredTags.isEmpty()) {
            return null;
        }

        int totalWeight = scores.stream().mapToInt(Integer::intValue).sum();
        int random = (int)(Math.random() * totalWeight);

        int cumulative = 0;
        for (int i = 0; i < scoredTags.size(); i++) {
            cumulative += scores.get(i);
            if (random < cumulative) {
                return scoredTags.get(i);
            }
        }

        return scoredTags.get(0);
    }

    //根据标签生成推荐理由
    private String getRecommendReasonByTag(String tag) {
        if (tag == null || tag.isEmpty()) {
            return "猜你喜欢";
        }

        // 口味类
        if (tag.equals("麻辣") || tag.equals("酸甜") || tag.equals("酸辣") ||
                tag.equals("咸香") || tag.equals("清淡") || tag.equals("原味") ||
                tag.equals("果味") || tag.equals("微辣") || tag.equals("奶香")) {
            return "偏好" + tag;
        }
        // 菜系类
        else if (tag.equals("川菜") || tag.equals("粤菜") || tag.equals("家常菜") ||
                tag.equals("汤羹") || tag.equals("小吃") || tag.equals("海鲜") ||
                tag.equals("凉菜") || tag.equals("烤箱菜")) {
            return "爱吃的" + tag;
        }
        // 工艺类
        else if (tag.equals("炒") || tag.equals("煮") || tag.equals("蒸") ||
                tag.equals("炖") || tag.equals("煎") || tag.equals("烤") ||
                tag.equals("拌") || tag.equals("焖")) {
            return tag + "菜";
        }
        else {
            return tag + "推荐";
        }
    }

    //获取热门推荐
    private List<RecommendVO> getHotRecommendation(Integer userId) {
        Set<Integer> excludedIds = userRecordMapper.getExcludedRecipeIds(userId);
        List<Recipe> hotRecipes = recipeMapper.selectHotRecipes(excludedIds, TOP_RECOMMEND_LIMIT);

        List<RecommendVO> result = new ArrayList<>();
        for (Recipe recipe : hotRecipes) {
            RecommendVO vo = convertToRecommendVO(recipe);
            vo.setRecommendReason("热门推荐");
            result.add(vo);
        }
        return result;
    }

    //获取用户标签统计（带 Redis 缓存）
    private Map<String, Integer> getUserTagStatsFromRedis(Integer userId) {
        String cacheKey = "tag:stats:" + userId;

        // 从 Redis 获取
        Map<String, Integer> tagStats = (Map<String, Integer>) redisTemplate.opsForValue().get(cacheKey);
        if (tagStats != null) {
            return tagStats;
        }

        // 计算标签统计
        tagStats = calculateTagStats(userId);

        if (tagStats == null || tagStats.isEmpty()) {
            tagStats = new HashMap<>();
        }

        // 存入 Redis，过期时间30分钟
        redisTemplate.opsForValue().set(cacheKey, tagStats, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);

        return tagStats;
    }

    //计算用户标签统计（收藏权重2，浏览权重1）
    private Map<String, Integer> calculateTagStats(Integer userId) {
        Map<String, Integer> tagStats = new HashMap<>();

        List<Recipe> favorites = userRecordMapper.selectFavoritesByUserId(userId);
        for (Recipe recipe : favorites) {
            addTagsToStats(tagStats, recipe.getGeneralTags(), 2);
        }

        List<Recipe> histories = userRecordMapper.selectHistoryByUserId(userId);
        for (Recipe recipe : histories) {
            addTagsToStats(tagStats, recipe.getGeneralTags(), 1);
        }

        return tagStats;
    }

    //添加标签到统计
    private void addTagsToStats(Map<String, Integer> tagStats, List<String> tags, int weight) {
        if (tags == null || tags.isEmpty()) {
            return;
        }
        for (String tag : tags) {
            tagStats.put(tag, tagStats.getOrDefault(tag, 0) + weight);
        }
    }

    //转换为RecommendVO
    private RecommendVO convertToRecommendVO(Recipe recipe) {
        RecommendVO vo = new RecommendVO();
        vo.setRecipeId(recipe.getRecipeId());
        vo.setTitle(recipe.getTitle());
        vo.setImageUrl(recipe.getImageUrl());
        vo.setDescription(recipe.getTips());
        vo.setCookTime(recipe.getCookTime());
        vo.setDifficultyLevel(recipe.getDifficultyLevel());
        return vo;
    }

    // 分页处理
    private List<RecommendVO> paginate(List<RecommendVO> list, Integer page, Integer pageSize) {
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, list.size());

        if (start >= list.size()) {
            return new ArrayList<>();
        }

        return list.subList(start, end);
    }

    //清除用户推荐缓存（从 Redis 删除）
    public void clearUserRecommendCache(Integer userId) {
        String recommendKey = "recommend:" + userId;
        String tagStatsKey = "tag:stats:" + userId;

        redisTemplate.delete(recommendKey);
        redisTemplate.delete(tagStatsKey);

        log.info("清除用户推荐缓存: userId={}", userId);
    }

    //获取用户标签统计（调试）
    public Map<String, Integer> getUserTagStatsForDebug(Integer userId) {
        return getUserTagStatsFromRedis(userId);
    }
}