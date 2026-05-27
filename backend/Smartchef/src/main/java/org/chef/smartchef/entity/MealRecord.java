package org.chef.smartchef.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 饮食记录实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealRecord {

    private Integer recordId;
    private Integer userId;
    private LocalDate recordDate;
    
    /**
     * 餐食类型：breakfast/lunch/dinner/snack
     */
    private String mealType;
    
    /**
     * 食物名称
     */
    private String foodName;
    
    /**
     * 食物重量（克）
     */
    private Integer foodGrams;
    
    /**
     * 卡路里（大卡）
     */
    private Integer calories;
    
    /**
     * 蛋白质（克）
     */
    private Double protein;
    
    /**
     * 碳水化合物（克）
     */
    private Double carb;
    
    /**
     * 脂肪（克）
     */
    private Double fat;
    
    /**
     * 分量描述
     */
    private String portion;
    
    /**
     * 识别置信度
     */
    private Double confidence;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
