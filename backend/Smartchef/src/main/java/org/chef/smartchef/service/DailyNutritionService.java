package org.chef.smartchef.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.chef.smartchef.entity.DailyNutrition;
import org.chef.smartchef.entity.HealthProfile;
import org.chef.smartchef.mapper.HealthProfileMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DailyNutritionService {

    @Autowired
    HealthProfileMapper healthProfileMapper;

    @Autowired
    private ObjectMapper objectMapper;

    // 每日营养数据更新或插入
    @Transactional
    public void updateOrInsert(DailyNutrition nutrition) {
        DailyNutrition existing = healthProfileMapper.selectByUserAndDate(
                nutrition.getUserId(),
                nutrition.getRecordDate()
        );

        if (existing != null) {
            existing.setUserId(nutrition.getUserId());
            existing.setRecordDate(nutrition.getRecordDate());
            existing.setKcal(nutrition.getKcal());
            existing.setProtein(nutrition.getProtein());
            existing.setCarb(nutrition.getCarb());
            existing.setFat(nutrition.getFat());
            
            // 更新餐食记录 JSON
            if (nutrition.getMealRecords() != null) {
                existing.setMealRecords(nutrition.getMealRecords());
            }
            
            // 更新运动记录 JSON
            if (nutrition.getExerciseRecords() != null) {
                existing.setExerciseRecords(nutrition.getExerciseRecords());
            }
            
            // 更新运动消耗卡路里
            if (nutrition.getExerciseCalories() != null) {
                existing.setExerciseCalories(nutrition.getExerciseCalories());
            }
            
            // 更新净摄入卡路里
            if (nutrition.getNetCalories() != null) {
                existing.setNetCalories(nutrition.getNetCalories());
            }

            healthProfileMapper.updateByUserAndDate(existing);
            System.out.println("更新每日营养数据成功，userId: " + nutrition.getUserId());
        } else {
            healthProfileMapper.insertnutrition(nutrition);
            System.out.println("插入每日营养数据成功，userId: " + nutrition.getUserId());
        }
    }

    // 健康档案更新或插入
    @Transactional
    public void updateOrInsert(HealthProfile profile) {
        if (profile.getUserId() == null) {
            throw new RuntimeException("用户 ID 不能为空");
        }

        HealthProfile existing = healthProfileMapper.selectByUserId(profile.getUserId());

        if (existing != null) {
            // 更新
            existing.setAge(profile.getAge());
            existing.setGender(profile.getGender());
            existing.setHeight(profile.getHeight());
            existing.setWeight(profile.getWeight());
            existing.setDietGoal(profile.getDietGoal());
            existing.setTastePreference(profile.getTastePreference());
            existing.setAvoidFoods(profile.getAvoidFoods());
            existing.setChronicDisease(profile.getChronicDisease());
            existing.setSmokingStatus(profile.getSmokingStatus());
            existing.setExerciseFrequency(profile.getExerciseFrequency());
            existing.setSystolicBp(profile.getSystolicBp());
            existing.setDiastolicBp(profile.getDiastolicBp());
            existing.setFastingGlucose(profile.getFastingGlucose());
            existing.setCalorieGoal(profile.getCalorieGoal());
            existing.setCarbGoal(profile.getCarbGoal());
            existing.setProteinGoal(profile.getProteinGoal());
            existing.setFatGoal(profile.getFatGoal());

            healthProfileMapper.updateByUserId(existing);
            System.out.println("更新健康档案成功，userId: " + profile.getUserId());
        } else {
            // 插入
            healthProfileMapper.inserthealthprofile(profile);
            System.out.println("插入健康档案成功，userId: " + profile.getUserId());
        }
    }

    // 根据用户ID获取健康档案
    public HealthProfile getByUserId(Integer userId) {
        return healthProfileMapper.selectByUserId(userId);
    }

    // JSON字符串转List
    public List<String> parseJsonToList(String jsonStr) {
        try {
            if (jsonStr == null || jsonStr.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(jsonStr,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON解析失败", e);
        }
    }

    // List转JSON字符串
    public String listToJson(List<String> list) {
        try {
            if (list == null || list.isEmpty()) {
                return null;
            }
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON转换失败", e);
        }
    }
}