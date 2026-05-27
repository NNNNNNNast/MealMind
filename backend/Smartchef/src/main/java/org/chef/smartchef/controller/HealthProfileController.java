package org.chef.smartchef.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.dev33.satoken.annotation.SaCheckLogin;
import org.chef.smartchef.entity.DailyNutrition;
import org.chef.smartchef.entity.HealthProfile;
import org.chef.smartchef.mapper.HealthProfileMapper;
import org.chef.smartchef.service.DailyNutritionService;
import org.chef.smartchef.service.HealthIndexService;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/healthprofile")
public class HealthProfileController {

    @Autowired
    HealthProfileMapper healthProfileMapper;

    @Autowired
    DailyNutritionService dailyNutritionService;
    
    @Autowired
    HealthIndexService healthIndexService;



    //健康数据
    //查询
    @SaCheckLogin
    @GetMapping("/getnutrition")
    public Result<DailyNutrition> getNutrition(@RequestParam LocalDate recordDate)
    {
        try {
            DailyNutrition data = healthProfileMapper.selectByUserAndDate(StpUtil.getLoginIdAsInt(), recordDate);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("查询失败：" + e.getMessage());
        }
    }

    //更新
    @PostMapping("/updatanutrition")
    public Result<String> updatanutrition(@RequestBody DailyNutrition nutrition) {
        try {
            Integer userId = StpUtil.getLoginIdAsInt();
            nutrition.setUserId(userId);

            // 参数校验
            if (nutrition.getRecordDate() == null) {
                return Result.error("记录日期不能为空");
            }

            dailyNutritionService.updateOrInsert(nutrition);
            return Result.success("更新成功");

        } catch (Exception e) {
            return Result.error("未登录");
        }
    }
    
    // 获取健康指数
    @SaCheckLogin
    @GetMapping("/gethealthindex")
    public Result<Map<String, Object>> getHealthIndex() {
        try {
            Integer userId = StpUtil.getLoginIdAsInt();
            
            // 计算健康指数
            int healthIndex = healthIndexService.calculateHealthIndex(userId);
            
            // 返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("healthIndex", healthIndex);
            result.put("level", getHealthLevel(healthIndex));
            result.put("message", getHealthMessage(healthIndex));
            
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("获取健康指数失败：" + e.getMessage());
        }
    }
    
    // 根据得分返回健康等级
    private String getHealthLevel(int score) {
        if (score >= 90) return "优秀";
        if (score >= 80) return "良好";
        if (score >= 70) return "中等";
        if (score >= 60) return "及格";
        return "待改进";
    }
    
    // 根据得分返回健康建议
    private String getHealthMessage(int score) {
        if (score >= 90) return "太棒了！继续保持健康的生活方式！";
        if (score >= 80) return "做得很好！可以进一步优化饮食结构。";
        if (score >= 70) return "还不错，建议增加运动量。";
        if (score >= 60) return "需要改善，注意均衡饮食和规律运动。";
        return "加油！从记录每一餐和适量运动开始吧！";
    }


    //健康档案
    //查询
    @SaCheckLogin
    @GetMapping("/gethealthprofile")
    public Result<HealthProfile> getHealthProfile()
    {
        System.out.println("开始查询健康档案");
        try {
            HealthProfile data = healthProfileMapper.selectByUserId(StpUtil.getLoginIdAsInt());
            System.out.println("查询成功");
            if (data != null) {
                System.out.println("健康档案数据：" + data);
                System.out.println("营养目标：calorie=" + data.getCalorieGoal() 
                    + ", carb=" + data.getCarbGoal() 
                    + ", protein=" + data.getProteinGoal() 
                    + ", fat=" + data.getFatGoal());
            } else {
                System.out.println("健康档案数据为空");
            }
            return Result.success(data);
        } catch (Exception e) {
            System.out.println("查询失败：" + e.getMessage());
            e.printStackTrace();
            return Result.error("查询失败：" + e.getMessage());
        }
    }

    //插入/更新
    @PostMapping("/updatahealthprofile")
    public Result<String> saveHealthProfile(@RequestBody HealthProfile profile) {
        try {
            Integer userId = StpUtil.getLoginIdAsInt();
            profile.setUserId(userId);

            dailyNutritionService.updateOrInsert(profile);
            return Result.success("保存成功");
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("保存失败：" + e.getMessage());
        }
    }
}
