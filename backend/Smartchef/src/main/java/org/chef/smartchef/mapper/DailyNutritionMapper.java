package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.DailyNutrition;
import org.chef.smartchef.entity.NutritionSummary;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface DailyNutritionMapper {

    // 根据主键查询
    @Select("SELECT record_id, user_id, record_date, meal_type, kcal, protein, carb, fat, " +
            "meal_records, exercise_records, exercise_calories, net_calories, created_at, updated_at " +
            "FROM daily_nutrition WHERE record_id = #{recordId}")
    DailyNutrition selectByPrimaryKey(@Param("recordId") Integer recordId);

    // 根据用户 ID 和日期查询当日所有餐次数据
    @Select("SELECT record_id, user_id, record_date, meal_type, kcal, protein, carb, fat, " +
            "meal_records, exercise_records, exercise_calories, net_calories, created_at, updated_at " +
            "FROM daily_nutrition WHERE user_id = #{userId} AND record_date = #{recordDate}")
    List<DailyNutrition> selectByUserAndDate(@Param("userId") Integer userId,
                                             @Param("recordDate") LocalDate recordDate);

    // 根据用户ID、日期和餐次类型查询
    @Select("SELECT record_id, user_id, record_date, meal_type, kcal, protein, carb, fat, created_at, updated_at " +
            "FROM daily_nutrition WHERE user_id = #{userId} AND record_date = #{recordDate} AND meal_type = #{mealType}")
    DailyNutrition selectByUserDateAndMealType(@Param("userId") Integer userId,
                                               @Param("recordDate") LocalDate recordDate,
                                               @Param("mealType") String mealType);

    // 修改 DailyNutritionMapper
    @Select("SELECT " +
            "COALESCE(SUM(kcal), 0) as kcal, " +
            "COALESCE(SUM(protein), 0) as protein, " +
            "COALESCE(SUM(carb), 0) as carb, " +
            "COALESCE(SUM(fat), 0) as fat " +
            "FROM daily_nutrition " +
            "WHERE user_id = #{userId} AND record_date = #{recordDate}")
    NutritionSummary selectDailyTotal(@Param("userId") Integer userId,
                                      @Param("recordDate") LocalDate recordDate);

    // 插入
    @Insert("INSERT INTO daily_nutrition (user_id, record_date, meal_type, kcal, protein, carb, fat, created_at, updated_at) " +
            "VALUES (#{userId}, #{recordDate}, #{mealType}, #{kcal}, #{protein}, #{carb}, #{fat}, NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "recordId", keyColumn = "record_id")
    int insert(DailyNutrition nutrition);

    // 选择性插入
    @Insert("<script>" +
            "INSERT INTO daily_nutrition " +
            "<trim prefix='(' suffix=')' suffixOverrides=','>" +
            "<if test='userId != null'>user_id,</if>" +
            "<if test='recordDate != null'>record_date,</if>" +
            "<if test='mealType != null'>meal_type,</if>" +
            "<if test='kcal != null'>kcal,</if>" +
            "<if test='protein != null'>protein,</if>" +
            "<if test='carb != null'>carb,</if>" +
            "<if test='fat != null'>fat,</if>" +
            "created_at, updated_at" +
            "</trim>" +
            "<trim prefix='values (' suffix=')' suffixOverrides=','>" +
            "<if test='userId != null'>#{userId},</if>" +
            "<if test='recordDate != null'>#{recordDate},</if>" +
            "<if test='mealType != null'>#{mealType},</if>" +
            "<if test='kcal != null'>#{kcal},</if>" +
            "<if test='protein != null'>#{protein},</if>" +
            "<if test='carb != null'>#{carb},</if>" +
            "<if test='fat != null'>#{fat},</if>" +
            "NOW(), NOW()" +
            "</trim>" +
            "</script>")
    @Options(useGeneratedKeys = true, keyProperty = "recordId", keyColumn = "record_id")
    int insertSelective(DailyNutrition nutrition);

    // 根据主键选择性更新
    @Update("<script>" +
            "UPDATE daily_nutrition " +
            "<set>" +
            "<if test='userId != null'>user_id = #{userId},</if>" +
            "<if test='recordDate != null'>record_date = #{recordDate},</if>" +
            "<if test='mealType != null'>meal_type = #{mealType},</if>" +
            "<if test='kcal != null'>kcal = #{kcal},</if>" +
            "<if test='protein != null'>protein = #{protein},</if>" +
            "<if test='carb != null'>carb = #{carb},</if>" +
            "<if test='fat != null'>fat = #{fat},</if>" +
            "updated_at = NOW()" +
            "</set>" +
            "WHERE record_id = #{recordId}" +
            "</script>")
    int updateByPrimaryKeySelective(DailyNutrition nutrition);

    // 根据主键更新
    @Update("UPDATE daily_nutrition SET " +
            "user_id = #{userId}, " +
            "record_date = #{recordDate}, " +
            "meal_type = #{mealType}, " +
            "kcal = #{kcal}, " +
            "protein = #{protein}, " +
            "carb = #{carb}, " +
            "fat = #{fat}, " +
            "updated_at = NOW() " +
            "WHERE record_id = #{recordId}")
    int updateByPrimaryKey(DailyNutrition nutrition);

    // 根据用户ID、日期和餐次类型更新（用于累加营养）
    @Update("UPDATE daily_nutrition SET " +
            "kcal = kcal + #{kcal}, " +
            "protein = protein + #{protein}, " +
            "carb = carb + #{carb}, " +
            "fat = fat + #{fat}, " +
            "updated_at = NOW() " +
            "WHERE user_id = #{userId} AND record_date = #{recordDate} AND meal_type = #{mealType}")
    int accumulateNutrition(@Param("userId") Integer userId,
                            @Param("recordDate") LocalDate recordDate,
                            @Param("mealType") String mealType,
                            @Param("kcal") Integer kcal,
                            @Param("protein") Integer protein,
                            @Param("carb") Integer carb,
                            @Param("fat") Integer fat);

    // 删除
    @Delete("DELETE FROM daily_nutrition WHERE record_id = #{recordId}")
    int deleteByPrimaryKey(@Param("recordId") Integer recordId);

    @Delete("DELETE FROM daily_nutrition WHERE user_id = #{userId} AND record_date = #{recordDate}")
    int deleteByUserAndDate(@Param("userId") Integer userId,
                            @Param("recordDate") LocalDate recordDate);

    @Delete("DELETE FROM daily_nutrition WHERE user_id = #{userId} AND record_date = #{recordDate} AND meal_type = #{mealType}")
    int deleteByUserDateAndMealType(@Param("userId") Integer userId,
                                    @Param("recordDate") LocalDate recordDate,
                                    @Param("mealType") String mealType);

    // 查询日期范围内的营养记录
    @Select("SELECT record_id, user_id, record_date, meal_type, kcal, protein, carb, fat, created_at, updated_at " +
            "FROM daily_nutrition " +
            "WHERE user_id = #{userId} AND record_date BETWEEN #{startDate} AND #{endDate} " +
            "ORDER BY record_date, meal_type")
    List<DailyNutrition> selectByDateRange(@Param("userId") Integer userId,
                                           @Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    // 插入或更新
    @Insert("INSERT INTO daily_nutrition (user_id, record_date, meal_type, kcal, protein, carb, fat, created_at, updated_at) " +
            "VALUES (#{userId}, #{recordDate}, #{mealType}, #{kcal}, #{protein}, #{carb}, #{fat}, NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE " +
            "kcal = VALUES(kcal), " +
            "protein = VALUES(protein), " +
            "carb = VALUES(carb), " +
            "fat = VALUES(fat), " +
            "updated_at = NOW()")
    int upsert(DailyNutrition nutrition);
}