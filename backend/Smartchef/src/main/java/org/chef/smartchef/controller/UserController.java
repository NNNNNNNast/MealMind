package org.chef.smartchef.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.dev33.satoken.annotation.SaCheckLogin;
import org.chef.smartchef.dto.LoginDTO;
import org.chef.smartchef.dto.UserDTO;
import org.chef.smartchef.entity.User;
import org.chef.smartchef.mapper.UserMapper;
import org.chef.smartchef.service.UserService;
import org.chef.smartchef.utils.LoginUtils;
import org.chef.smartchef.vo.LoginVO;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private LoginUtils loginUtils;

    @Autowired
    private UserService userService;

    @Autowired
    UserMapper userMapper;

    //登录
    @PostMapping("/login")
    public Result<LoginVO> login(@RequestBody LoginDTO loginDTO) {
        try {
            String code = loginDTO.getCode();
            if (code == null || code.isEmpty()) {
                return Result.error("code 不能为空");
            }

            // 用 code 换 openid
            String openid = loginUtils.getOpenid(code);
            if (openid == null) {
                return Result.error("微信登录失败");
            }

            // 查/建用户
            User user = userService.findOrCreate(openid);

            // Sa-Token 登录
            StpUtil.login(user.getUserId());

            //获取 token
            String token = StpUtil.getTokenValue();

            //返回 LoginVO
            LoginVO loginVO = new LoginVO();
            loginVO.setUserId(user.getUserId());
            loginVO.setNickname(user.getNickname());
            loginVO.setAvatar(user.getAvatar());
            loginVO.setProfileId(user.getProfileId());
            loginVO.setToken(token);

            return Result.success("登录成功", loginVO);

        } catch (Exception e) {
            return Result.error("登录失败：" + e.getMessage());
        }
    }

    //获取用户信息
    @SaCheckLogin
    @GetMapping("/info")
    public Result<User> getUserInfo() {
        try {
            Integer userId = StpUtil.getLoginIdAsInt();
            User user = userMapper.findById(userId);

            if (user == null) {
                return Result.error("用户不存在");
            }

            user.setOpenid(null);  // 不返回 openid
            return Result.success(user);

        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/update")
    public Result<String> updateUser(@RequestBody UserDTO updateDTO) {
        try {
            Integer userId = StpUtil.getLoginIdAsInt();
            System.out.println(userId);
            // 查询原用户
            User user = userMapper.findById(userId);
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 只更新允许修改的字段
            if (updateDTO.getNickname() != null) {
                user.setNickname(updateDTO.getNickname());
            }
            if (updateDTO.getAvatar() != null) {
                user.setAvatar(updateDTO.getAvatar());
            }


            // 更新数据库
            userMapper.update(user);

            return Result.success("更新成功");

        } catch (Exception e) {
            return Result.error("更新失败：" + e.getMessage());
        }
    }

    //退出登录
    @PostMapping("/logout")
    public Result<String> logout() {
        if (StpUtil.isLogin()) {
            StpUtil.logout();
        }
        return Result.success("退出成功");
    }



    //host 作者页面 - 作者基本信息
    @GetMapping("/{userId}")
    public Result<User> getUserInfo(@PathVariable Long userId) {
        User userInfo = userService.getUserInfo(userId);
        return Result.success(userInfo);
    }

    //获取用户的关注列表
    @GetMapping("/following/list")
    public Result<List<User>> getFollowingList(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {

        int offset = (page - 1) * pageSize;
        List<User> followingList = userService.getFollowingList(userId, offset, pageSize);
        return Result.success(followingList);
    }
}