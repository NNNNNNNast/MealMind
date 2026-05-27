package org.chef.smartchef.controller;


import cn.dev33.satoken.stp.StpUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.chef.smartchef.entity.Recipe;
import org.chef.smartchef.mapper.RecipeMapper;
import org.chef.smartchef.service.RecommendationService;
import org.chef.smartchef.vo.RecommendVO;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recipe")
public class RecipeController {

    @Autowired
    public RecipeMapper recipeMapper;

    @Autowired
    RecommendationService recommendationService;

    //id 查询
    @GetMapping("id")
    public Result<Recipe> getRecipeById(@RequestParam Integer recipeId) {
        Recipe recipe = recipeMapper.getRecipeById(recipeId);
        System.out.println("查询" + recipe.getTitle());
        return Result.success(recipe);
    }

    //关键词
    @GetMapping("/keyword")
    public Result<List<Recipe>> getByTitle(@RequestParam String keyword) {
        List<Recipe> recipes = recipeMapper.searchRecipesByKeyword(keyword);
        int num = recipes.size();
        System.out.println("title:找到" + num + "条记录");
        return Result.success(recipes);
    }

    //单个 tag 查询
    @GetMapping("/tag")
    public Result<List<Recipe>> getByTag(@RequestParam String tag) {
        List<Recipe> recipes = recipeMapper.searchRecipesByTag(tag);
        int num = recipes.size();
        System.out.println("tag:找到" + num + "条记录");
        return Result.success(recipes);
    }

    //难度
    @GetMapping("/difficulty")
    public Result<List<Recipe>> getByDifficulty(@RequestParam String difficulty) {
        List<Recipe> recipes = recipeMapper.searchRecipesByDifficulty(difficulty);
        int num = recipes.size();
        System.out.println("difficulty:找到" + num + "条记录");
        return Result.success(recipes);
    }

    //时间
    @GetMapping("/time")
    public Result<List<Recipe>> getByTime(@RequestParam String time) {
        List<Recipe> recipes = recipeMapper.searchRecipesByTime(time);
        int num = recipes.size();
        System.out.println("time:找到" + num + "条记录");
        return Result.success(recipes);
    }

    //复合查询
    @GetMapping("/tags")
    public Result<List<Recipe>> getByTags(@RequestParam(required = false) List<String> tags) {
        // 如果 tags 为 null 或空，返回全部
        if (tags == null || tags.isEmpty()) {
            List<Recipe> recipes = recipeMapper.selectAll();
            return Result.success(recipes);
        }

        // 打印看看实际收到的格式
        System.out.println("收到的 tags: " + tags);
        System.out.println("大小：" + tags.size());
        for (int i = 0; i < tags.size(); i++) {
            System.out.println("tags[" + i + "] = '" + tags.get(i) + "'");
        }

        String firstTag = tags.get(0);
        if (firstTag.startsWith("[") || firstTag.contains("\"")) {
            // 解析 JSON 数组字符串
            try {
                ObjectMapper mapper = new ObjectMapper();
                List<String> parsedTags = mapper.readValue(
                        firstTag,
                        new TypeReference<List<String>>() {
                        }
                );
                List<Recipe> recipes = recipeMapper.searchRecipesByTags(parsedTags);
                return Result.success(recipes);
            } catch (Exception e) {
                e.printStackTrace();
                return Result.error("查询失败：" + e.getMessage());
            }
        }

        List<Recipe> recipes = recipeMapper.searchRecipesByTags(tags);
        return Result.success(recipes);
    }

    //全部
    @GetMapping("all")
    public Result<List<Recipe>> getAll() {
        List<Recipe> recipes = recipeMapper.selectAll();
        System.out.println("获取全部" + recipes.size() + "条记录");
        return Result.success(recipes);
    }

    //食谱推荐
    @GetMapping("/recommend")
    public Result<List<RecommendVO>> recommend(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {

        Integer userId = StpUtil.getLoginIdAsInt();
        List<RecommendVO> list = recommendationService.getRecommend(userId, page, pageSize);
        return Result.success(list);
    }

    @GetMapping("/recommend/all")
    public Result<List<RecommendVO>> getAllRecommend() {
        Integer userId = StpUtil.getLoginIdAsInt();

        List<RecommendVO> list = recommendationService.getRecommend(userId, 1, 100);

        return Result.success(list);
    }
}
