package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.Recipe;
import org.chef.smartchef.utils.JsonListTypeHandler;

import java.util.List;
import java.util.Set;

@Mapper
public interface RecipeMapper {

    // 全部
    @Select("select * from recipe ORDER BY recipe_id DESC")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> selectAll();

    // 根据id查食谱(食谱详情页用)
    @Select("SELECT * from recipe where recipe_id = #{recipeId}")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    Recipe getRecipeById(@Param("recipeId") Integer recipeId);

    // 批量查询食谱（根据 recipeId 列表）
    @Select("<script>" +
            "SELECT * FROM recipe WHERE recipe_id IN " +
            "<foreach collection='recipeId' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " ORDER BY recipe_id DESC" +
            "</script>")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> selectRecipesByIds(@Param("recipeId") List<Integer> recipeId);

    // 根据关键词在所有文本字段中模糊搜索
    @Select("SELECT * FROM recipe WHERE " +
            "title LIKE CONCAT('%', #{keyword}, '%') " +
            "OR tips LIKE CONCAT('%', #{keyword}, '%') " +
            "OR difficulty_level LIKE CONCAT('%', #{keyword}, '%') " +
            "OR cook_time LIKE CONCAT('%', #{keyword}, '%') " +
            "ORDER BY " +
            "   CASE " +
            "       WHEN title LIKE CONCAT('%', #{keyword}, '%') THEN 1 " +
            "       WHEN tips LIKE CONCAT('%', #{keyword}, '%') THEN 2 " +
            "       WHEN difficulty_level LIKE CONCAT('%', #{keyword}, '%') THEN 3 " +
            "       WHEN cook_time LIKE CONCAT('%', #{keyword}, '%') THEN 4 " +
            "       ELSE 5 " +
            "   END, " +
            "   recipe_id DESC")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> searchRecipesByKeyword(@Param("keyword") String keyword);

    // 标签查询（单个）
    @Select("SELECT * FROM recipe WHERE JSON_CONTAINS(general_tags, JSON_ARRAY(#{tag}))")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> searchRecipesByTag(@Param("tag") String tag);

    // 根据难度查询
    @Select("SELECT * FROM recipe WHERE difficulty_level = #{difficulty} ORDER BY recipe_id DESC")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> searchRecipesByDifficulty(@Param("difficulty") String difficulty);

    // 根据时间查询
    @Select("SELECT * FROM recipe WHERE cook_time = #{time} ORDER BY recipe_id DESC")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> searchRecipesByTime(@Param("time") String time);

    // 多个标签复合查询（包含任意标签）
    @Select("<script>" +
            "SELECT * FROM recipe WHERE " +
            "<foreach item='tag' collection='tags' separator=' AND '>" +
            "   (difficulty_level = #{tag} OR " +
            "    cook_time = #{tag} OR " +
            "    JSON_CONTAINS(general_tags, JSON_ARRAY(#{tag})))" +
            "</foreach>" +
            " ORDER BY recipe_id" +
            "</script>")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> searchRecipesByTags(@Param("tags") List<String> tags);


    //推荐筛选食谱
    @Select("<script>" +
            "SELECT * FROM recipe WHERE 1=1 " +
            "<if test='excludedIds != null and excludedIds.size() > 0'>" +
            "   AND recipe_id NOT IN " +
            "   <foreach collection='excludedIds' item='id' open='(' separator=',' close=')'>" +
            "       #{id}" +
            "   </foreach>" +
            "</if>" +
            " AND (" +
            "   <foreach collection='tags' item='tag' separator=' OR '>" +
            "       JSON_CONTAINS(general_tags, CONCAT('\"', #{tag}, '\"'))" +
            "   </foreach>" +
            " )" +
            " ORDER BY recipe_id DESC " +
            " LIMIT #{limit}" +
            "</script>")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> selectByTags(@Param("tags") List<String> tags,
                              @Param("excludedIds") Set<Integer> excludedIds,
                              @Param("limit") int limit);


    //获取刷新食谱
    @Select("<script>" +
            "SELECT * FROM recipe " +
            "<if test='excludedIds != null and excludedIds.size() > 0'>" +
            "   WHERE recipe_id NOT IN " +
            "   <foreach collection='excludedIds' item='id' open='(' separator=',' close=')'>" +
            "       #{id}" +
            "   </foreach>" +
            "</if>" +
            " ORDER BY recipe_id DESC " +
            " LIMIT #{limit}" +
            "</script>")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> selectLatestWithExclude(@Param("excludedIds") Set<Integer> excludedIds,
                                         @Param("limit") int limit);


    @Select("<script>" +
            "SELECT * FROM recipe " +
            "<if test='excludedIds != null and excludedIds.size() > 0'>" +
            "   WHERE recipe_id NOT IN " +
            "   <foreach collection='excludedIds' item='id' open='(' separator=',' close=')'>" +
            "       #{id}" +
            "   </foreach>" +
            "</if>" +
            " ORDER BY recipe_id DESC " +
            " LIMIT #{limit}" +
            "</script>")
    @Results({
            @Result(property = "recipeId", column = "recipe_id"),
            @Result(property = "imageUrl", column = "image_url"),
            @Result(property = "ingredients", column = "ingredients", typeHandler = JsonListTypeHandler.class),
            @Result(property = "steps", column = "steps", typeHandler = JsonListTypeHandler.class),
            @Result(property = "generalTags", column = "general_tags", typeHandler = JsonListTypeHandler.class),
            @Result(property = "difficultyLevel", column = "difficulty_level"),
            @Result(property = "cookTime", column = "cook_time")
    })
    List<Recipe> selectHotRecipes(@Param("excludedIds") Set<Integer> excludedIds,
                                  @Param("limit") int limit);

    // 管理员CRUD方法
    @Insert("INSERT INTO recipe (title, image_url, ingredients, steps, tips, general_tags, difficulty_level, cook_time) " +
            "VALUES (#{title}, #{imageUrl}, #{ingredients, typeHandler=org.chef.smartchef.utils.JsonListTypeHandler}, " +
            "#{steps, typeHandler=org.chef.smartchef.utils.JsonListTypeHandler}, #{tips}, " +
            "#{generalTags, typeHandler=org.chef.smartchef.utils.JsonListTypeHandler}, #{difficultyLevel}, #{cookTime})")
    @Options(useGeneratedKeys = true, keyProperty = "recipeId", keyColumn = "recipe_id")
    int insert(Recipe recipe);

    @Update("UPDATE recipe SET title = #{title}, image_url = #{imageUrl}, " +
            "ingredients = #{ingredients, typeHandler=org.chef.smartchef.utils.JsonListTypeHandler}, " +
            "steps = #{steps, typeHandler=org.chef.smartchef.utils.JsonListTypeHandler}, " +
            "tips = #{tips}, " +
            "general_tags = #{generalTags, typeHandler=org.chef.smartchef.utils.JsonListTypeHandler}, " +
            "difficulty_level = #{difficultyLevel}, cook_time = #{cookTime} " +
            "WHERE recipe_id = #{recipeId}")
    int update(Recipe recipe);

    @Delete("DELETE FROM recipe WHERE recipe_id = #{recipeId}")
    int deleteById(@Param("recipeId") Integer recipeId);



}