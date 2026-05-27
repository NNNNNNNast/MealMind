package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.Recipe;
import org.chef.smartchef.entity.UserRecord;
import org.chef.smartchef.utils.JsonListTypeHandler;
import org.chef.smartchef.vo.RecipeWithTimeVO;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Mapper
public interface UserRecordMapper {

    // 收藏
    // 插入收藏
    @Insert("INSERT INTO user_record (user_id, recipe_id, type) VALUES (#{userId}, #{recipeId}, #{type})")
    int insertFavorite(@Param("userId") Integer userId, @Param("recipeId") Integer recipeId, @Param("type") String type);

    // 删除收藏
    @Delete("DELETE FROM user_record WHERE user_id = #{userId} AND recipe_id = #{recipeId} AND type = #{type}")
    int deleteFavorite(@Param("userId") Integer userId, @Param("recipeId") Integer recipeId, @Param("type") String type);

    // 查询收藏列表
    @Select("SELECT * FROM user_record WHERE user_id = #{userId} AND type = 'favorite' ORDER BY created_at DESC")
    List<UserRecord> selectFavoritesByUser(@Param("userId") Integer userId);

    // 查询单个收藏
    @Select("SELECT * FROM user_record WHERE user_id = #{userId} AND recipe_id = #{recipeId} AND type = #{type}")
    UserRecord selectFavoriteByUserAndRecipe(@Param("userId") Integer userId, @Param("recipeId") Integer recipeId, @Param("type") String type);

    // 历史记录
    // 插入历史记录
    @Insert("INSERT INTO user_record (user_id, recipe_id, type) VALUES (#{userId}, #{recipeId}, #{type})")
    int insertHistory(@Param("userId") Integer userId, @Param("recipeId") Integer recipeId, @Param("type") String type);

    // 删除历史记录
    @Delete("DELETE FROM user_record WHERE user_id = #{userId} AND recipe_id = #{recipeId} AND type = #{type}")
    int deleteHistory(@Param("userId") Integer userId, @Param("recipeId") Integer recipeId, @Param("type") String type);

    // 查询历史记录列表
    @Select("SELECT * FROM user_record WHERE user_id = #{userId} AND type = 'history' ORDER BY created_at DESC")
    List<UserRecord> selectHistoryByUser(@Param("userId") Integer userId);

    // 查询历史列表（返回带访问时间的食谱VO）
    @Select("SELECT r.recipe_id, r.title, r.image_url, ur.created_at as view_time " +
            "FROM user_record ur " +
            "JOIN recipe r ON ur.recipe_id = r.recipe_id " +
            "WHERE ur.user_id = #{userId} AND ur.type = 'history' " +
            "ORDER BY ur.created_at DESC")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "title", column = "title"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "viewTime", column = "view_time")
    })
    List<RecipeWithTimeVO> selectHistoryWithTime(@Param("userId") Integer userId);


    //获取用户收藏的食谱列表
    @Select("SELECT r.* FROM recipe r " +
            "INNER JOIN user_record ur ON r.recipe_id = ur.recipe_id " +
            "WHERE ur.user_id = #{userId} AND ur.type = 'favorite' " +
            "ORDER BY ur.created_at DESC")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> selectFavoritesByUserId(@Param("userId") Integer userId);

    //获取用户历史记录的食谱列表
    @Select("SELECT r.* FROM recipe r " +
            "INNER JOIN user_record ur ON r.recipe_id = ur.recipe_id " +
            "WHERE ur.user_id = #{userId} AND ur.type = 'history' " +
            "ORDER BY ur.created_at DESC")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> selectHistoryByUserId(@Param("userId") Integer userId);

    //获取用户已浏览和收藏的食谱ID集合
    @Select("SELECT DISTINCT recipe_id FROM user_record WHERE user_id = #{userId} AND type IN ('favorite', 'history')")
    Set<Integer> getExcludedRecipeIds(@Param("userId") Integer userId);
}