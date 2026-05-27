package org.chef.smartchef.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyNutrition {

    private Integer recordId;
    private Integer userId;
    private LocalDate recordDate;
    private Integer kcal;
    private Integer protein;
    private String mealType;
    private Integer carb;
    private Integer fat;
    
    /**
     * 餐食记录 JSON 数组
     * 格式：[{"mealType":"breakfast","foodName":"苹果","calories":78,...}]
     */
    private String mealRecords;
    
    /**
     * 运动记录 JSON 数组
     * 格式：[{"exerciseName":"跑步","duration":30,"calories":240,...}]
     */
    private String exerciseRecords;
    
    /**
     * 运动消耗总卡路里
     */
    private Integer exerciseCalories;
    
    /**
     * 净摄入卡路里（摄入 - 运动）
     */
    private Integer netCalories;
    
    private LocalDateTime  createdAt;
    private LocalDateTime  updatedAt;
}
