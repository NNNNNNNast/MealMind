package org.chef.smartchef.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthProfile {

    private Integer profileId;
    private Integer userId;
    private Integer age;
    private Integer gender;
    private Double height;
    private Double weight;
    private Double bmi;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private String dietGoal;
    private String tastePreference;
    private String avoidFoods;
    private String chronicDisease;
    private Integer smokingStatus;
    private String exerciseFrequency;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Double fastingGlucose;
    private Integer calorieGoal;
    private Integer carbGoal;
    private Integer proteinGoal;
    private Integer fatGoal;
}
