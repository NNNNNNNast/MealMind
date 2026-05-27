package org.chef.smartchef.controller;

import cn.dev33.satoken.stp.StpUtil;
import org.chef.smartchef.entity.Recipe;
import org.chef.smartchef.entity.UserRecord;
import org.chef.smartchef.mapper.RecipeMapper;
import org.chef.smartchef.mapper.UserRecordMapper;
import org.chef.smartchef.service.RecommendationService;
import org.chef.smartchef.vo.RecipeWithTimeVO;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/user_record")
public class UserRecordController {

    @Autowired
    UserRecordMapper userRecordMapper;
    @Autowired
    RecipeMapper recipeMapper;
    @Autowired
    private RecommendationService recommendationService;

    //收藏
    // 添加收藏
    @PostMapping("/updatefavorite")
    public Result<String> updateFavorite(@RequestParam Integer recipeId) {
        Integer userId = StpUtil.getLoginIdAsInt();
        System.out.println("添加收藏：" + recipeId + " - 用户 id：" + userId);

        try {
            if (userRecordMapper.insertFavorite(userId, recipeId, "favorite") >= 1) {
                recommendationService.clearUserRecommendCache(userId);
                return Result.success("收藏成功");
            } else {
                return Result.error("收藏失败");
            }
        } catch (Exception e) {
            return Result.error("已经收藏过了");
        }
    }

    // 取消收藏
    @PostMapping("/deletefavorite")
    public Result<String> deleteFavorite(@RequestParam Integer recipeId) {
        Integer userId = StpUtil.getLoginIdAsInt();
        System.out.println("取消收藏：" + recipeId + " - 用户 id：" + userId);

        if (userRecordMapper.deleteFavorite(userId, recipeId, "favorite") >= 1) {
            recommendationService.clearUserRecommendCache(userId);
            return Result.success("取消收藏成功");
        } else {
            return Result.error("取消收藏失败");
        }
    }

    // 查询收藏列表
    @GetMapping("/favorites")
    public Result<List<Recipe>> getFavorites() {
        Integer userId = StpUtil.getLoginIdAsInt();
        List<UserRecord> records = userRecordMapper.selectFavoritesByUser(userId);
        System.out.println("查询收藏：用户 id：" + userId + "，共" + records.size() + "条记录");

        if (records.isEmpty()) {
            return Result.success(List.of());
        }

        List<Integer> recipeIds = records.stream()
                .map(UserRecord::getRecipeId)
                .collect(Collectors.toList());

        List<Recipe> recipes = recipeMapper.selectRecipesByIds(recipeIds);
        return Result.success(recipes);
    }

    // 查询是否收藏
    @GetMapping("/favorite")
    public Result<Boolean> isFavorite(@RequestParam Integer recipeId) {
        Integer userId = StpUtil.getLoginIdAsInt();
        UserRecord record = userRecordMapper.selectFavoriteByUserAndRecipe(userId, recipeId, "favorite");
        return Result.success(record != null);
    }

    // 历史记录
    // 添加历史记录
    @PostMapping("/updatehistory")
    public Result<String> insertHistory(@RequestParam Integer recipeId) {
        Integer userId = StpUtil.getLoginIdAsInt();
        System.out.println("添加历史记录：" + recipeId + " - 用户 id：" + userId);

        // 先删除相同菜谱（实现最新浏览记录置顶）
        userRecordMapper.deleteHistory(userId, recipeId, "history");

        // 插入新的历史记录
        if (userRecordMapper.insertHistory(userId, recipeId, "history") >= 1) {
            recommendationService.clearUserRecommendCache(userId);
            return Result.success("添加历史记录成功");
        } else {
            return Result.error("添加历史记录失败");
        }
    }

    // 查询历史列表（带访问时间）
    @GetMapping("/gethistory")
    public Result<List<RecipeWithTimeVO>> getHistory() {
        Integer userId = StpUtil.getLoginIdAsInt();
        List<RecipeWithTimeVO> records = userRecordMapper.selectHistoryWithTime(userId);
        System.out.println("查询历史记录：用户 id：" + userId + "，共" + records.size() + "条记录");
        return Result.success(records);
    }

    // 删除单条历史记录
    @PostMapping("/deletehistory")
    public Result<String> deleteHistory(@RequestParam Integer recipeId) {
        Integer userId = StpUtil.getLoginIdAsInt();
        System.out.println("删除历史记录：" + recipeId + " - 用户 id：" + userId);

        if (userRecordMapper.deleteHistory(userId, recipeId, "history") >= 1) {
            recommendationService.clearUserRecommendCache(userId);
            return Result.success("删除历史记录成功");
        } else {
            return Result.error("删除历史记录失败");
        }
    }

}