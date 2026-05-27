package org.chef.smartchef.service;

import lombok.extern.slf4j.Slf4j;
import org.chef.smartchef.entity.ExerciseRecord;
import org.chef.smartchef.mapper.ExerciseRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 运动记录 Service
 */
@Slf4j
@Service
public class ExerciseRecordService {

    @Autowired
    private ExerciseRecordMapper exerciseRecordMapper;
    
    /**
     * 获取用户指定日期的运动记录
     */
    public Map<String, Object> getRecordsByDate(Integer userId, LocalDate recordDate) {
        log.info("查询用户 {} 在 {} 的运动记录", userId, recordDate);
        
        List<ExerciseRecord> records = exerciseRecordMapper.selectByUserIdAndDate(userId, recordDate);
        
        int totalCalories = 0;
        int totalDuration = 0;
        
        for (ExerciseRecord record : records) {
            totalCalories += record.getCalories() != null ? record.getCalories() : 0;
            totalDuration += record.getDuration() != null ? record.getDuration() : 0;
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("summary", Map.of(
            "totalCalories", totalCalories,
            "totalDuration", totalDuration,
            "recordCount", records.size()
        ));
        
        return result;
    }
    
    /**
     * 添加运动记录
     */
    @Transactional
    public int addRecord(Integer userId, ExerciseRecord exerciseRecord) {
        log.info("添加运动记录：userId={}, exerciseName={}, calories={}", userId, exerciseRecord.getExerciseName(), exerciseRecord.getCalories());
        
        exerciseRecord.setUserId(userId);
        if (exerciseRecord.getRecordDate() == null) {
            exerciseRecord.setRecordDate(LocalDate.now());
        }
        
        return exerciseRecordMapper.insert(exerciseRecord);
    }
    
    /**
     * 批量添加运动记录
     */
    @Transactional
    public int addRecords(Integer userId, List<ExerciseRecord> records) {
        log.info("批量添加运动记录：userId={}, count={}", userId, records.size());
        
        for (ExerciseRecord record : records) {
            record.setUserId(userId);
            if (record.getRecordDate() == null) {
                record.setRecordDate(LocalDate.now());
            }
        }
        
        return exerciseRecordMapper.insertBatch(records);
    }
    
    /**
     * 删除运动记录
     */
    @Transactional
    public int deleteRecord(Integer userId, Integer recordId) {
        log.info("删除运动记录：userId={}, recordId={}", userId, recordId);
        return exerciseRecordMapper.deleteById(recordId);
    }
    
    /**
     * 更新运动记录
     */
    @Transactional
    public int updateRecord(Integer userId, ExerciseRecord exerciseRecord) {
        log.info("更新运动记录：userId={}, recordId={}", userId, exerciseRecord.getRecordId());
        return exerciseRecordMapper.update(exerciseRecord);
    }
}
