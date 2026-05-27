package org.chef.smartchef.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 运动记录实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseRecord {

    private Integer recordId;
    private Integer userId;
    private LocalDate recordDate;
    
    /**
     * 运动名称
     */
    private String exerciseName;
    
    /**
     * 运动时长（分钟）
     */
    private Integer duration;
    
    /**
     * 强度等级：low/medium/high
     */
    private String intensity;
    
    /**
     * MET 值
     */
    private Double metValue;
    
    /**
     * 消耗卡路里（大卡）
     */
    private Integer calories;
    
    /**
     * 每小时消耗（大卡）
     */
    private Integer caloriesPerHour;
    
    /**
     * 运动分类
     */
    private String category;
    
    /**
     * 运动描述和建议
     */
    private String description;
    
    /**
     * 识别置信度
     */
    private Double confidence;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
