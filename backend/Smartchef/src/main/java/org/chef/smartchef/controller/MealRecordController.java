package org.chef.smartchef.controller;

import cn.dev33.satoken.stp.StpUtil;
import lombok.extern.slf4j.Slf4j;
import org.chef.smartchef.entity.MealRecord;
import org.chef.smartchef.service.MealRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

//饮食记录
@Slf4j
@RestController
@RequestMapping("/meal")
public class MealRecordController {

    @Autowired
    private MealRecordService mealRecordService;
    
    //查询指定日期的饮食记录
    @GetMapping("/list")
    public Map<String, Object> listRecords(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate recordDate
    ) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("查询饮食记录：userId={}, date={}", userId, recordDate);
        
        return mealRecordService.getRecordsByDate(userId, recordDate);
    }
    
    //添加饮食记录
    @PostMapping("/add")
    public Map<String, Object> addRecord(@RequestBody MealRecord mealRecord) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("添加饮食记录：userId={}, food={}", userId, mealRecord.getFoodName());
        
        try {
            mealRecordService.addRecord(userId, mealRecord);
            return Map.of(
                "code", 200,
                "msg", "添加成功",
                "data", mealRecord
            );
        } catch (Exception e) {
            log.error("添加饮食记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "添加失败：" + e.getMessage()
            );
        }
    }
    
    //批量添加饮食记录
    @PostMapping("/batch-add")
    public Map<String, Object> batchAddRecords(@RequestBody List<MealRecord> records) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("批量添加饮食记录：userId={}, count={}", userId, records.size());
        
        try {
            mealRecordService.addRecords(userId, records);
            return Map.of(
                "code", 200,
                "msg", "批量添加成功"
            );
        } catch (Exception e) {
            log.error("批量添加饮食记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "批量添加失败：" + e.getMessage()
            );
        }
    }
    
    //删除饮食记录
    @DeleteMapping("/delete/{recordId}")
    public Map<String, Object> deleteRecord(@PathVariable Integer recordId) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("删除饮食记录：userId={}, recordId={}", userId, recordId);
        
        try {
            mealRecordService.deleteRecord(userId, recordId);
            return Map.of(
                "code", 200,
                "msg", "删除成功"
            );
        } catch (Exception e) {
            log.error("删除饮食记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "删除失败：" + e.getMessage()
            );
        }
    }
    
    //更新饮食记录
    @PutMapping("/update")
    public Map<String, Object> updateRecord(@RequestBody MealRecord mealRecord) {
        Integer userId = StpUtil.getLoginIdAsInt();
        log.info("更新饮食记录：userId={}, recordId={}", userId, mealRecord.getRecordId());
        
        try {
            mealRecordService.updateRecord(userId, mealRecord);
            return Map.of(
                "code", 200,
                "msg", "更新成功"
            );
        } catch (Exception e) {
            log.error("更新饮食记录失败", e);
            return Map.of(
                "code", 500,
                "msg", "更新失败：" + e.getMessage()
            );
        }
    }
}
