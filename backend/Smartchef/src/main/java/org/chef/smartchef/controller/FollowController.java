package org.chef.smartchef.controller;

import org.chef.smartchef.service.UserService;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/follow")
public class FollowController {

    @Autowired
    private UserService userService;

    //检查当前用户是否已关注目标作者
    @PostMapping("/check")
    public Result<Map<String, Boolean>> checkFollow(@RequestBody Map<String, Integer> params) {
        Integer userId = params.get("user_id");
        Integer authorId = params.get("author_id");

        if (userId == null || authorId == null) {
            return Result.error("参数不完整");
        }

        boolean followed = userService.isFollowing(userId, authorId);

        Map<String, Boolean> data = new HashMap<>();
        data.put("is_followed", followed);

        return Result.success(data);
    }

    //执行关注操作
    @PostMapping("/follow")
    public Result<Map<String, Boolean>> follow(@RequestBody Map<String, Integer> params) {
        Integer userId = params.get("user_id");
        Integer authorId = params.get("author_id");

        boolean success = userService.follow(userId, authorId);

        if (!success) {
            boolean followed = userService.isFollowing(userId, authorId);
            Map<String, Boolean> data = new HashMap<>();
            data.put("is_followed", followed);
            return Result.success(data);
        }

        boolean followed = userService.isFollowing(userId, authorId);

        Map<String, Boolean> data = new HashMap<>();
        data.put("is_followed", followed);

        return Result.success(data);
    }

    //执行取消关注操作
    @PostMapping("/unfollow")
    public Result<Map<String, Boolean>> unfollow(@RequestBody Map<String, Integer> params) {
        Integer userId = params.get("user_id");
        Integer authorId = params.get("author_id");

        boolean success = userService.unfollow(userId, authorId);

        if (!success) {
            boolean followed = userService.isFollowing(userId, authorId);
            Map<String, Boolean> data = new HashMap<>();
            data.put("is_followed", followed);
            return Result.success(data);
        }

        boolean followed = userService.isFollowing(userId, authorId);

        Map<String, Boolean> data = new HashMap<>();
        data.put("is_followed", followed);

        return Result.success(data);
    }
}