package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.DailyNutrition;
import org.chef.smartchef.entity.HealthProfile;

import java.time.LocalDate;

@Mapper
public interface HealthProfileMapper {

    // 每日数据
    @Select("SELECT record_id, user_id, record_date, kcal, protein, carb, fat, meal_records AS mealRecords, exercise_records AS exerciseRecords, exercise_calories AS exerciseCalories, net_calories AS netCalories, created_at, updated_at FROM daily_nutrition WHERE user_id = #{userId} AND record_date = #{recordDate}")
    DailyNutrition selectByUserAndDate(@Param("userId") Integer userId, @Param("recordDate") LocalDate recordDate);

    @Insert("INSERT INTO daily_nutrition (user_id, record_date, kcal, protein, carb, fat, meal_records, exercise_records, exercise_calories, net_calories) VALUES (#{userId}, #{recordDate}, #{kcal}, #{protein}, #{carb}, #{fat}, #{mealRecords}, #{exerciseRecords}, #{exerciseCalories}, #{netCalories})")
    @Options(useGeneratedKeys = true, keyProperty = "recordId", keyColumn = "record_id")
    int insertnutrition(DailyNutrition nutrition);

    @Update("UPDATE daily_nutrition SET kcal = #{kcal}, protein = #{protein}, carb = #{carb}, fat = #{fat}, meal_records = #{mealRecords}, exercise_records = #{exerciseRecords}, exercise_calories = #{exerciseCalories}, net_calories = #{netCalories}, updated_at = NOW() WHERE user_id = #{userId} AND record_date = #{recordDate}")
    int updateByUserAndDate(DailyNutrition nutrition);

    // 健康档案
    @Select("SELECT profile_id, user_id, age, gender, height, weight, " +
            "bmi, diet_goal AS dietGoal, taste_preference AS tastePreference, avoid_foods AS avoidFoods, " +
            "chronic_disease AS chronicDisease, smoking_status AS smokingStatus, exercise_frequency AS exerciseFrequency, " +
            "systolic_bp AS systolicBp, diastolic_bp AS diastolicBp, fasting_glucose AS fastingGlucose, " +
            "calorie_goal AS calorieGoal, carb_goal AS carbGoal, protein_goal AS proteinGoal, fat_goal AS fatGoal, " +
            "created_at AS createdAt, updated_at AS updatedAt " +
            "FROM healthprofile WHERE user_id = #{userId}")
    HealthProfile selectByUserId(@Param("userId") Integer userId);

    // 插入
    @Insert("INSERT INTO healthprofile (user_id, age, gender, height, weight, " +
            "diet_goal, taste_preference, avoid_foods, " +
            "chronic_disease, smoking_status, exercise_frequency, " +
            "systolic_bp, diastolic_bp, fasting_glucose, " +
            "calorie_goal, carb_goal, protein_goal, fat_goal) " +
            "VALUES (#{userId}, #{age}, #{gender}, #{height}, #{weight}, " +
            "#{dietGoal}, #{tastePreference}, #{avoidFoods}, " +
            "#{chronicDisease}, #{smokingStatus}, #{exerciseFrequency}, " +
            "#{systolicBp}, #{diastolicBp}, #{fastingGlucose}, " +
            "#{calorieGoal}, #{carbGoal}, #{proteinGoal}, #{fatGoal})")
    @Options(useGeneratedKeys = true, keyProperty = "profileId", keyColumn = "profile_id")
    int inserthealthprofile(HealthProfile profile);

    // 更新
    @Update("UPDATE healthprofile SET " +
            "age = #{age}, " +
            "gender = #{gender}, " +
            "height = #{height}, " +
            "weight = #{weight}, " +
            "diet_goal = #{dietGoal}, " +
            "taste_preference = #{tastePreference}, " +
            "avoid_foods = #{avoidFoods}, " +
            "chronic_disease = #{chronicDisease}, " +
            "smoking_status = #{smokingStatus}, " +
            "exercise_frequency = #{exerciseFrequency}, " +
            "systolic_bp = #{systolicBp}, " +
            "diastolic_bp = #{diastolicBp}, " +
            "fasting_glucose = #{fastingGlucose}, " +
            "calorie_goal = #{calorieGoal}, " +
            "carb_goal = #{carbGoal}, " +
            "protein_goal = #{proteinGoal}, " +
            "fat_goal = #{fatGoal}, " +
            "updated_at = NOW() " +
            "WHERE user_id = #{userId}")
    int updateByUserId(HealthProfile profile);
}