package org.chef.smartchef.service;

import org.chef.smartchef.entity.DailyNutrition;
import org.chef.smartchef.mapper.HealthProfileMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 健康指数计算服务
 * 根据近期饮食和运动记录综合计算健康得分（0-100）
 */
@Service
public class HealthIndexService {

    @Autowired
    private HealthProfileMapper healthProfileMapper;

    /**
     * 计算用户的健康指数
     * @param userId 用户 ID
     * @return 健康指数得分（0-100）
     */
    public int calculateHealthIndex(Integer userId) {
        // 获取最近 7 天的数据
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6);
        
        List<DailyNutrition> nutritionList = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DailyNutrition nutrition = healthProfileMapper.selectByUserAndDate(userId, date);
            if (nutrition != null) {
                nutritionList.add(nutrition);
            }
        }
        
        // 如果没有数据，返回 50 分（基础分）
        if (nutritionList.isEmpty()) {
            return 50;
        }
        
        // 计算各项得分
        double dietScore = calculateDietScore(nutritionList);
        double exerciseScore = calculateExerciseScore(nutritionList);
        double consistencyScore = calculateConsistencyScore(nutritionList);
        
        // 综合得分（权重：饮食 40% + 运动 30% + 规律性 30%）
        int totalScore = (int) Math.round(dietScore * 0.4 + exerciseScore * 0.3 + consistencyScore * 0.3);
        
        // 确保分数在 0-100 范围内
        return Math.max(0, Math.min(100, totalScore));
    }
    
    /**
     * 饮食质量得分（0-100）
     * 评估标准：
     * - 卡路里摄入是否合理（40%）
     * - 营养均衡度（蛋白质、碳水、脂肪比例）（40%）
     * - 三餐规律性（20%）
     */
    private double calculateDietScore(List<DailyNutrition> nutritionList) {
        if (nutritionList.isEmpty()) {
            return 50;
        }
        
        double calorieScore = 0;
        double nutritionBalanceScore = 0;
        double mealRegularityScore = 0;
        
        int validDays = 0;
        
        for (DailyNutrition nutrition : nutritionList) {
            // 1. 卡路里得分（目标范围的 80%-120% 为最佳）
            int calorieGoal = 1800; // 可以从健康档案获取
            int actualKcal = nutrition.getKcal() != null ? nutrition.getKcal() : 0;
            
            if (actualKcal > 0) {
                double calorieRatio = (double) actualKcal / calorieGoal;
                if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
                    calorieScore += 100;
                } else if (calorieRatio < 0.8) {
                    calorieScore += Math.max(0, 100 - (0.8 - calorieRatio) * 200);
                } else {
                    calorieScore += Math.max(0, 100 - (calorieRatio - 1.2) * 200);
                }
                
                // 2. 营养均衡度得分（蛋白质：碳水：脂肪 ≈ 15%:55%:30%）
                int protein = nutrition.getProtein() != null ? nutrition.getProtein() : 0;
                int carb = nutrition.getCarb() != null ? nutrition.getCarb() : 0;
                int fat = nutrition.getFat() != null ? nutrition.getFat() : 0;
                
                int totalNutritionCalories = (int) (protein * 4 + carb * 4 + fat * 9);
                if (totalNutritionCalories > 0) {
                    double proteinRatio = (protein * 4.0) / totalNutritionCalories;
                    double carbRatio = (carb * 4.0) / totalNutritionCalories;
                    double fatRatio = (fat * 9.0) / totalNutritionCalories;
                    
                    // 计算与理想比例的偏差
                    double proteinDeviation = Math.abs(proteinRatio - 0.15);
                    double carbDeviation = Math.abs(carbRatio - 0.55);
                    double fatDeviation = Math.abs(fatRatio - 0.30);
                    
                    double totalDeviation = proteinDeviation + carbDeviation + fatDeviation;
                    nutritionBalanceScore += Math.max(0, 100 - totalDeviation * 150);
                }
                
                validDays++;
            }
        }
        
        if (validDays > 0) {
            calorieScore /= validDays;
            nutritionBalanceScore /= validDays;
            // 规律性得分：有记录的天数比例
            mealRegularityScore = (double) validDays / 7 * 100;
        }
        
        // 权重：卡路里 40% + 均衡度 40% + 规律性 20%
        return calorieScore * 0.4 + nutritionBalanceScore * 0.4 + mealRegularityScore * 0.2;
    }
    
    /**
     * 运动得分（0-100）
     * 评估标准：
     * - 运动频率（40%）
     * - 运动强度（30%）
     * - 运动消耗（30%）
     */
    private double calculateExerciseScore(List<DailyNutrition> nutritionList) {
        if (nutritionList.isEmpty()) {
            return 50;
        }
        
        int exerciseDays = 0;
        int totalExerciseCalories = 0;
        int highIntensityDays = 0;
        
        for (DailyNutrition nutrition : nutritionList) {
            Integer exerciseCalories = nutrition.getExerciseCalories();
            if (exerciseCalories != null && exerciseCalories > 0) {
                exerciseDays++;
                totalExerciseCalories += exerciseCalories;
                
                // 高强度运动：消耗 > 300 大卡
                if (exerciseCalories > 300) {
                    highIntensityDays++;
                }
            }
        }
        
        // 频率得分：每周运动 3-5 天最佳
        double frequencyScore;
        if (exerciseDays >= 3 && exerciseDays <= 5) {
            frequencyScore = 100;
        } else if (exerciseDays < 3) {
            frequencyScore = (double) exerciseDays / 3 * 100;
        } else {
            frequencyScore = Math.max(0, 100 - (exerciseDays - 5) * 20);
        }
        
        // 强度得分：高强度运动天数比例
        double intensityScore = exerciseDays > 0 ? (double) highIntensityDays / exerciseDays * 100 : 0;
        
        // 消耗得分：平均每天消耗 200-400 大卡最佳
        double avgExerciseCalories = (double) totalExerciseCalories / 7;
        double caloriesScore;
        if (avgExerciseCalories >= 200 && avgExerciseCalories <= 400) {
            caloriesScore = 100;
        } else if (avgExerciseCalories < 200) {
            caloriesScore = avgExerciseCalories / 200 * 100;
        } else {
            caloriesScore = Math.max(0, 100 - (avgExerciseCalories - 400) / 200 * 100);
        }
        
        // 权重：频率 40% + 强度 30% + 消耗 30%
        return frequencyScore * 0.4 + intensityScore * 0.3 + caloriesScore * 0.3;
    }
    
    /**
     * 规律性得分（0-100）
     * 评估标准：
     * - 记录连续性
     * - 数据完整性
     */
    private double calculateConsistencyScore(List<DailyNutrition> nutritionList) {
        if (nutritionList.isEmpty()) {
            return 50;
        }
        
        // 连续性得分：7 天中有记录的天数
        double continuityScore = (double) nutritionList.size() / 7 * 100;
        
        // 完整性得分：有完整营养数据的比例
        int completeDays = 0;
        for (DailyNutrition nutrition : nutritionList) {
            if (nutrition.getKcal() != null && nutrition.getKcal() > 0 &&
                nutrition.getProtein() != null &&
                nutrition.getCarb() != null &&
                nutrition.getFat() != null) {
                completeDays++;
            }
        }
        double completenessScore = (double) completeDays / nutritionList.size() * 100;
        
        // 权重：连续性 60% + 完整性 40%
        return continuityScore * 0.6 + completenessScore * 0.4;
    }
}
