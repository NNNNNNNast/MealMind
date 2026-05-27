package org.chef.smartchef.controller;

import cn.dev33.satoken.stp.StpUtil;
import lombok.extern.slf4j.Slf4j;
import org.chef.smartchef.entity.ExerciseRecord;
import org.chef.smartchef.service.ExerciseRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

//运动记录
@Slf4j
@RestController
@RequestMapping("/exercise")
public class ExerciseRecordController {

    @Autowired
    private ExerciseRecordService exerciseRecordService;
    
    //查询指定日期的运动记录
    @GetMapping("/list")
    public Map<String, Object> listRecords(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate recordDate
    ) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("查询运动记录：userId={}, date={}", userId, recordDate);
        
        return exerciseRecordService.getRecordsByDate(userId, recordDate);
    }
    
    //添加运动记录
    @PostMapping("/add")
    public Map<String, Object> addRecord(@RequestBody ExerciseRecord exerciseRecord) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("添加运动记录：userId={}, exercise={}", userId, exerciseRecord.getExerciseName());
        
        try {
            exerciseRecordService.addRecord(userId, exerciseRecord);
            return Map.of(
                "code", 200,
                "msg", "添加成功",
                "data", exerciseRecord
            );
        } catch (Exception e) {
            log.error("添加运动记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "添加失败：" + e.getMessage()
            );
        }
    }
    
    //批量添加运动记录
    @PostMapping("/batch-add")
    public Map<String, Object> batchAddRecords(@RequestBody List<ExerciseRecord> records) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("批量添加运动记录：userId={}, count={}", userId, records.size());
        
        try {
            exerciseRecordService.addRecords(userId, records);
            return Map.of(
                "code", 200,
                "msg", "批量添加成功"
            );
        } catch (Exception e) {
            log.error("批量添加运动记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "批量添加失败：" + e.getMessage()
            );
        }
    }
    
    //删除运动记录
    @DeleteMapping("/delete/{recordId}")
    public Map<String, Object> deleteRecord(@PathVariable Integer recordId) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("删除运动记录：userId={}, recordId={}", userId, recordId);
        
        try {
            exerciseRecordService.deleteRecord(userId, recordId);
            return Map.of(
                "code", 200,
                "msg", "删除成功"
            );
        } catch (Exception e) {
            log.error("删除运动记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "删除失败：" + e.getMessage()
            );
        }
    }
    
    //更新运动记录
    @PutMapping("/update")
    public Map<String, Object> updateRecord(@RequestBody ExerciseRecord exerciseRecord) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("更新运动记录：userId={}, recordId={}", userId, exerciseRecord.getRecordId());
        
        try {
            exerciseRecordService.updateRecord(userId, exerciseRecord);
            return Map.of(
                "code", 200,
                "msg", "更新成功"
            );
        } catch (Exception e) {
            log.error("更新运动记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "更新失败：" + e.getMessage()
            );
        }
    }
}
