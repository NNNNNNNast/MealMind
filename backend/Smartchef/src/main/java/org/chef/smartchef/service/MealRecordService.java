package org.chef.smartchef.service;

import lombok.extern.slf4j.Slf4j;
import org.chef.smartchef.entity.MealRecord;
import org.chef.smartchef.mapper.MealRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 饮食记录 Service
 */
@Slf4j
@Service
public class MealRecordService {

    @Autowired
    private MealRecordMapper mealRecordMapper;
    
    /**
     * 获取用户指定日期的饮食记录
     */
    public Map<String, Object> getRecordsByDate(Integer userId, LocalDate recordDate) {
        log.info("查询用户 {} 在 {} 的饮食记录", userId, recordDate);
        
        List<MealRecord> records = mealRecordMapper.selectByUserIdAndDate(userId, recordDate);
        
        // 按餐食类型分组
        Map<String, List<MealRecord>> groupedByMealType = new HashMap<>();
        int totalCalories = 0;
        double totalProtein = 0;
        double totalCarb = 0;
        double totalFat = 0;
        
        for (MealRecord record : records) {
            String mealType = record.getMealType();
            if (!groupedByMealType.containsKey(mealType)) {
                groupedByMealType.put(mealType, new java.util.ArrayList<>());
            }
            groupedByMealType.get(mealType).add(record);
            
            totalCalories += record.getCalories() != null ? record.getCalories() : 0;
            totalProtein += record.getProtein() != null ? record.getProtein() : 0;
            totalCarb += record.getCarb() != null ? record.getCarb() : 0;
            totalFat += record.getFat() != null ? record.getFat() : 0;
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("groupedByMealType", groupedByMealType);
        result.put("summary", Map.of(
            "totalCalories", totalCalories,
            "totalProtein", totalProtein,
            "totalCarb", totalCarb,
            "totalFat", totalFat
        ));
        
        return result;
    }
    
    /**
     * 添加饮食记录
     */
    @Transactional
    public int addRecord(Integer userId, MealRecord mealRecord) {
        log.info("添加饮食记录：userId={}, foodName={}, calories={}", userId, mealRecord.getFoodName(), mealRecord.getCalories());
        
        mealRecord.setUserId(userId);
        if (mealRecord.getRecordDate() == null) {
            mealRecord.setRecordDate(LocalDate.now());
        }
        
        return mealRecordMapper.insert(mealRecord);
    }
    
    /**
     * 批量添加饮食记录
     */
    @Transactional
    public int addRecords(Integer userId, List<MealRecord> records) {
        log.info("批量添加饮食记录：userId={}, count={}", userId, records.size());
        
        for (MealRecord record : records) {
            record.setUserId(userId);
            if (record.getRecordDate() == null) {
                record.setRecordDate(LocalDate.now());
            }
        }
        
        return mealRecordMapper.insertBatch(records);
    }
    
    /**
     * 删除饮食记录
     */
    @Transactional
    public int deleteRecord(Integer userId, Integer recordId) {
        log.info("删除饮食记录：userId={}, recordId={}", userId, recordId);
        return mealRecordMapper.deleteById(recordId);
    }
    
    /**
     * 更新饮食记录
     */
    @Transactional
    public int updateRecord(Integer userId, MealRecord mealRecord) {
        log.info("更新饮食记录：userId={}, recordId={}", userId, mealRecord.getRecordId());
        return mealRecordMapper.update(mealRecord);
    }
}
