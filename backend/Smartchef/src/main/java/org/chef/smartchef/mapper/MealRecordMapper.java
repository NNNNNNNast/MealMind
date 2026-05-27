package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.MealRecord;

import java.time.LocalDate;
import java.util.List;

//饮食记录
@Mapper
public interface MealRecordMapper {

    //根据日期查询用户的所有饮食记录
    @Select("SELECT * FROM meal_record WHERE user_id = #{userId} AND record_date = #{recordDate} ORDER BY created_at DESC")
    List<MealRecord> selectByUserIdAndDate(@Param("userId") Integer userId, @Param("recordDate") LocalDate recordDate);
    
    //添加饮食记录
    @Insert("INSERT INTO meal_record (user_id, record_date, meal_type, food_name, food_grams, calories, protein, carb, fat, portion, confidence) " +
            "VALUES (#{userId}, #{recordDate}, #{mealType}, #{foodName}, #{foodGrams}, #{calories}, #{protein}, #{carb}, #{fat}, #{portion}, #{confidence})")
    @Options(useGeneratedKeys = true, keyProperty = "recordId")
    int insert(MealRecord mealRecord);
    
    //批量添加饮食记录
    @Insert("<script>" +
            "INSERT INTO meal_record (user_id, record_date, meal_type, food_name, food_grams, calories, protein, carb, fat, portion, confidence) VALUES " +
            "<foreach collection='records' item='record' separator=','>" +
            "(#{record.userId}, #{record.recordDate}, #{record.mealType}, #{record.foodName}, #{record.foodGrams}, #{record.calories}, #{record.protein}, #{record.carb}, #{record.fat}, #{record.portion}, #{record.confidence})" +
            "</foreach>" +
            "</script>")
    int insertBatch(@Param("records") List<MealRecord> records);
    
    //删除指定日期的饮食记录
    @Delete("DELETE FROM meal_record WHERE user_id = #{userId} AND record_date = #{recordDate}")
    int deleteByUserIdAndDate(@Param("userId") Integer userId, @Param("recordDate") LocalDate recordDate);
    
    //删除单条记录
    @Delete("DELETE FROM meal_record WHERE record_id = #{recordId}")
    int deleteById(Integer recordId);
    
    //更新饮食记录
    @Update("UPDATE meal_record SET food_name = #{foodName}, food_grams = #{foodGrams}, calories = #{calories}, " +
            "protein = #{protein}, carb = #{carb}, fat = #{fat}, portion = #{portion}, confidence = #{confidence} " +
            "WHERE record_id = #{recordId}")
    int update(MealRecord mealRecord);
}
