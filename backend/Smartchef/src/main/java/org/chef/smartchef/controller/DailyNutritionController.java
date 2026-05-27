package org.chef.smartchef.controller;

import org.chef.smartchef.entity.DailyNutrition;
import org.chef.smartchef.entity.HealthProfile;
import org.chef.smartchef.entity.NutritionSummary;
import org.chef.smartchef.mapper.DailyNutritionMapper;
import org.chef.smartchef.mapper.HealthProfileMapper;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/daily")
public class DailyNutritionController {

    private static final String[] VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"};
    private static final int DEFAULT_USER_ID = 1;

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,  // yyyy-MM-dd
            DateTimeFormatter.ofPattern("yyyy-M-d"),   // yyyy-M-d
            DateTimeFormatter.ofPattern("yyyy/MM/dd"), // yyyy/MM/dd
            DateTimeFormatter.ofPattern("yyyy/M/d")    // yyyy/M/d
    );

    @Autowired
    private DailyNutritionMapper dailyNutritionMapper;

    @Autowired
    private HealthProfileMapper healthProfileMapper;

    // 获取健康档案
    @GetMapping("/gethealthprofile")
    public Result<HealthProfile> getHealthProfile(@RequestParam(required = false) Integer userId) {
        Integer currentUserId = getCurrentUserId(userId);
        HealthProfile profile = healthProfileMapper.selectByUserId(currentUserId);
        return Result.success(profile);
    }

    // 更新健康档案
    @PostMapping("/updatehealthprofile")
    public Result<HealthProfile> updateHealthProfile(@RequestBody HealthProfile healthProfile) {
        healthProfile.setUserId(getCurrentUserId(null));
        healthProfile.setUpdatedAt(LocalDateTime.now());

        HealthProfile existing = healthProfileMapper.selectByUserId(healthProfile.getUserId());

        int rows;
        if (existing == null) {
            healthProfile.setCreatedAt(LocalDateTime.now());
            rows = healthProfileMapper.inserthealthprofile(healthProfile);
        } else {
            healthProfile.setProfileId(existing.getProfileId());
            rows = healthProfileMapper.updateByUserId(healthProfile);
        }

        if (rows > 0) {
            return Result.success(healthProfile);
        } else {
            return Result.error("保存失败");
        }
    }

    // 获取当日营养汇总（所有餐次之和）
    @GetMapping("/getnutrition")
    public Result<Map<String, Object>> getNutrition(@RequestParam String recordDate,
                                                    @RequestParam(required = false) Integer userId) {
        Integer currentUserId = getCurrentUserId(userId);
        LocalDate date = parseDate(recordDate);
        if (date == null) {
            return Result.error("日期格式错误，请使用 yyyy-MM-dd 格式");
        }

        // 获取当日营养汇总
        NutritionSummary total = dailyNutritionMapper.selectDailyTotal(currentUserId, date);

        // 获取当日所有餐次详情
        List<DailyNutrition> meals = dailyNutritionMapper.selectByUserAndDate(currentUserId, date);

        if (total == null) {
            total = NutritionSummary.builder()
                    .kcal(0)
                    .protein(0)
                    .carb(0)
                    .fat(0)
                    .build();
        }

        Map<String, Object> data = new HashMap<>();
        data.put("total", total);
        data.put("meals", meals != null ? meals : List.of());

        return Result.success(data);
    }

    // 获取指定餐次的营养数据
    @GetMapping("/getnutritionbymeal")
    public Result<DailyNutrition> getNutritionByMeal(@RequestParam String recordDate,
                                                     @RequestParam String mealType,
                                                     @RequestParam(required = false) Integer userId) {
        // 验证餐次类型
        if (!isValidMealType(mealType)) {
            return Result.error("无效的餐次类型，有效值：breakfast, lunch, dinner, snack");
        }

        Integer currentUserId = getCurrentUserId(userId);
        LocalDate date = parseDate(recordDate);
        if (date == null) {
            return Result.error("日期格式错误，请使用 yyyy-MM-dd 格式");
        }

        DailyNutrition nutrition = dailyNutritionMapper.selectByUserDateAndMealType(
                currentUserId, date, mealType
        );

        if (nutrition == null) {
            nutrition = DailyNutrition.builder()
                    .userId(currentUserId)
                    .recordDate(date)
                    .mealType(mealType)
                    .kcal(0)
                    .protein(0)
                    .carb(0)
                    .fat(0)
                    .build();
        }

        return Result.success(nutrition);
    }

    // 获取指定日期所有餐次的营养数据
    @GetMapping("/getnutritionbydate")
    public Result<List<DailyNutrition>> getNutritionByDate(@RequestParam String recordDate,
                                                           @RequestParam(required = false) Integer userId) {
        Integer currentUserId = getCurrentUserId(userId);
        LocalDate date = parseDate(recordDate);
        if (date == null) {
            return Result.error("日期格式错误，请使用 yyyy-MM-dd 格式");
        }

        List<DailyNutrition> meals = dailyNutritionMapper.selectByUserAndDate(currentUserId, date);

        return Result.success(meals != null ? meals : List.of());
    }

    // 更新或添加营养数据（单个餐次）
    @PostMapping("/updatenutrition")
    public Result<DailyNutrition> updateNutrition(@RequestBody DailyNutrition nutrition) {
        if (nutrition.getRecordDate() == null) {
            return Result.error("记录日期不能为空");
        }

        String mealType = nutrition.getMealType();
        if (!isValidMealType(mealType)) {
            return Result.error("无效的餐次类型，有效值：breakfast, lunch, dinner, snack");
        }

        nutrition.setUserId(getCurrentUserId(null));
        nutrition.setUpdatedAt(LocalDateTime.now());

        DailyNutrition existing = dailyNutritionMapper.selectByUserDateAndMealType(
                nutrition.getUserId(),
                nutrition.getRecordDate(),
                mealType
        );

        int rows;
        if (existing == null) {
            nutrition.setCreatedAt(LocalDateTime.now());
            rows = dailyNutritionMapper.insertSelective(nutrition);
        } else {
            nutrition.setRecordId(existing.getRecordId());
            rows = dailyNutritionMapper.updateByPrimaryKeySelective(nutrition);
        }

        if (rows > 0) {
            return Result.success("保存成功", nutrition);
        } else {
            return Result.error("保存失败");
        }
    }

    // 累加营养数据
    @PostMapping("/addnutrition")
    public Result<String> addNutrition(@RequestBody DailyNutrition nutrition) {
        if (nutrition.getRecordDate() == null) {
            return Result.error("记录日期不能为空");
        }

        String mealType = nutrition.getMealType();
        if (!isValidMealType(mealType)) {
            return Result.error("无效的餐次类型，有效值：breakfast, lunch, dinner, snack");
        }

        if (isNegativeValue(nutrition)) {
            return Result.error("营养数值不能为负数");
        }

        nutrition.setUserId(getCurrentUserId(null));

        DailyNutrition existing = dailyNutritionMapper.selectByUserDateAndMealType(
                nutrition.getUserId(),
                nutrition.getRecordDate(),
                mealType
        );

        int rows;
        if (existing == null) {
            nutrition.setCreatedAt(LocalDateTime.now());
            nutrition.setUpdatedAt(LocalDateTime.now());
            nutrition.setKcal(getValueOrDefault(nutrition.getKcal()));
            nutrition.setProtein(getValueOrDefault(nutrition.getProtein()));
            nutrition.setCarb(getValueOrDefault(nutrition.getCarb()));
            nutrition.setFat(getValueOrDefault(nutrition.getFat()));
            rows = dailyNutritionMapper.insertSelective(nutrition);
        } else {
            rows = dailyNutritionMapper.accumulateNutrition(
                    nutrition.getUserId(),
                    nutrition.getRecordDate(),
                    mealType,
                    getValueOrDefault(nutrition.getKcal()),
                    getValueOrDefault(nutrition.getProtein()),
                    getValueOrDefault(nutrition.getCarb()),
                    getValueOrDefault(nutrition.getFat())
            );
        }

        if (rows > 0) {
            return Result.success("添加成功", null);
        } else {
            return Result.error("添加失败");
        }
    }

    // 删除指定餐次的营养记录
    @DeleteMapping("/deletenutrition")
    public Result<String> deleteNutrition(@RequestParam String recordDate,
                                          @RequestParam String mealType,
                                          @RequestParam(required = false) Integer userId) {
        if (!isValidMealType(mealType)) {
            return Result.error("无效的餐次类型");
        }

        Integer currentUserId = getCurrentUserId(userId);
        LocalDate date = parseDate(recordDate);
        if (date == null) {
            return Result.error("日期格式错误，请使用 yyyy-MM-dd 格式");
        }

        int rows = dailyNutritionMapper.deleteByUserDateAndMealType(currentUserId, date, mealType);

        if (rows > 0) {
            return Result.success("删除成功", null);
        } else {
            return Result.error("删除失败，记录不存在");
        }
    }

    // 删除指定日期的所有营养记录
    @DeleteMapping("/deletenutritionbydate")
    public Result<String> deleteNutritionByDate(@RequestParam String recordDate,
                                                @RequestParam(required = false) Integer userId) {
        Integer currentUserId = getCurrentUserId(userId);
        LocalDate date = parseDate(recordDate);
        if (date == null) {
            return Result.error("日期格式错误，请使用 yyyy-MM-dd 格式");
        }

        int rows = dailyNutritionMapper.deleteByUserAndDate(currentUserId, date);

        if (rows > 0) {
            return Result.success("删除成功，共删除 " + rows + " 条记录", null);
        } else {
            return Result.error("删除失败，无记录");
        }
    }


    private Integer getCurrentUserId(Integer userId) {
        return userId != null ? userId : DEFAULT_USER_ID;
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException e) {
            }
        }

        return null;
    }

    private boolean isValidMealType(String mealType) {
        if (mealType == null) return false;
        for (String validType : VALID_MEAL_TYPES) {
            if (validType.equals(mealType)) {
                return true;
            }
        }
        return false;
    }

    private boolean isNegativeValue(DailyNutrition nutrition) {
        return (nutrition.getKcal() != null && nutrition.getKcal() < 0) ||
                (nutrition.getProtein() != null && nutrition.getProtein() < 0) ||
                (nutrition.getCarb() != null && nutrition.getCarb() < 0) ||
                (nutrition.getFat() != null && nutrition.getFat() < 0);
    }

    private int getValueOrDefault(Integer value) {
        return value != null ? value : 0;
    }
}