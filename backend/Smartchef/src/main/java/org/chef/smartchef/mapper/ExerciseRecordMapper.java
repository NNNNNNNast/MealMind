package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.ExerciseRecord;

import java.time.LocalDate;
import java.util.List;

//运动记录
@Mapper
public interface ExerciseRecordMapper {

    //根据日期查询用户的所有运动记录
    @Select("SELECT * FROM exercise_record WHERE user_id = #{userId} AND record_date = #{recordDate} ORDER BY created_at DESC")
    List<ExerciseRecord> selectByUserIdAndDate(@Param("userId") Integer userId, @Param("recordDate") LocalDate recordDate);
    
    //添加运动记录
    @Insert("INSERT INTO exercise_record (user_id, record_date, exercise_name, duration, intensity, met_value, calories, calories_per_hour, category, description, confidence) " +
            "VALUES (#{userId}, #{recordDate}, #{exerciseName}, #{duration}, #{intensity}, #{metValue}, #{calories}, #{caloriesPerHour}, #{category}, #{description}, #{confidence})")
    @Options(useGeneratedKeys = true, keyProperty = "recordId")
    int insert(ExerciseRecord exerciseRecord);
    
    //批量添加运动记录
    @Insert("<script>" +
            "INSERT INTO exercise_record (user_id, record_date, exercise_name, duration, intensity, met_value, calories, calories_per_hour, category, description, confidence) VALUES " +
            "<foreach collection='records' item='record' separator=','>" +
            "(#{record.userId}, #{record.recordDate}, #{record.exerciseName}, #{record.duration}, #{record.intensity}, #{record.metValue}, #{record.calories}, #{record.caloriesPerHour}, #{record.category}, #{record.description}, #{record.confidence})" +
            "</foreach>" +
            "</script>")
    int insertBatch(@Param("records") List<ExerciseRecord> records);
    
    //删除指定日期的运动记录
    @Delete("DELETE FROM exercise_record WHERE user_id = #{userId} AND record_date = #{recordDate}")
    int deleteByUserIdAndDate(@Param("userId") Integer userId, @Param("recordDate") LocalDate recordDate);
    
    //删除单条记录
    @Delete("DELETE FROM exercise_record WHERE record_id = #{recordId}")
    int deleteById(Integer recordId);
    
    //更新运动记录
    @Update("UPDATE exercise_record SET exercise_name = #{exerciseName}, duration = #{duration}, intensity = #{intensity}, " +
            "met_value = #{metValue}, calories = #{calories}, calories_per_hour = #{caloriesPerHour}, " +
            "category = #{category}, description = #{description}, confidence = #{confidence} " +
            "WHERE record_id = #{recordId}")
    int update(ExerciseRecord exerciseRecord);
}
