package org.chef.smartchef.controller;

import org.chef.smartchef.entity.User;
import org.chef.smartchef.mapper.UserMapper;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/user")
public class AdminUserController {

    @Autowired
    private UserMapper userMapper;

    // 获取所有用户列表
    @GetMapping("/list")
    public Result<List<User>> list(@RequestParam(required = false) String keyword) {
        try {
            List<User> list;
            if (keyword != null && !keyword.isEmpty()) {
                list = userMapper.searchByKeyword(keyword);
            } else {
                list = userMapper.selectAll();
            }
            return Result.success(list);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    //获取用户详情
    @GetMapping("/{id}")
    public Result<User> getById(@PathVariable Integer id) {
        try {
            User user = userMapper.findById(id);
            if (user != null) {
                return Result.success(user);
            } else {
                return Result.error("用户不存在");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}