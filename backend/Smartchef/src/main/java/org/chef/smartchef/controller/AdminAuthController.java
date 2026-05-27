package org.chef.smartchef.controller;

import org.chef.smartchef.entity.User;
import org.chef.smartchef.mapper.UserMapper;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminAuthController {

    @Autowired
    private UserMapper userMapper;

    // 管理员登录
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> params) {
        String nickname = params.get("nickname");
        String password = params.get("password");

        //查询用户
        User user = userMapper.findByNicknameAndPassword(nickname, password);

        //验证
        if (user == null) {
            return Result.error("账号或密码错误");
        }

        if (user.getUserKey() == null || user.getUserKey() < 1) {
            return Result.error("无权限访问后台");
        }

        //登录成功
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getUserId());
        data.put("nickname", user.getNickname());
        data.put("userKey", user.getUserKey());
        data.put("avatar", user.getAvatar());

        return Result.success(data);
    }
}