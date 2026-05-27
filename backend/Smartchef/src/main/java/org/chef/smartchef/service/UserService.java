package org.chef.smartchef.service;


import org.chef.smartchef.entity.HealthProfile;
import org.chef.smartchef.entity.User;
import org.chef.smartchef.mapper.HealthProfileMapper;
import org.chef.smartchef.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
public class UserService {

    @Autowired
    UserMapper userMapper;

    @Autowired
    HealthProfileMapper healthProfileMapper;

    //根据openid查询或创建用户
    @Transactional
    public User findOrCreate(String openid) {
        User user = userMapper.findByOpenid(openid);

        if (user == null) {
            user = new User();
            user.setOpenid(openid);
            user.setNickname("用户_" + System.currentTimeMillis() % 10000);
            user.setAvatar("https://img1.baidu.com/it/u=105216936,2956740654&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500");
            user.setUserKey(0);
            userMapper.insert(user);
            
            HealthProfile profile = new HealthProfile();
            profile.setUserId(user.getUserId());
            profile.setGender(0);
            profile.setDietGoal("");
            profile.setTastePreference("");
            profile.setAvoidFoods("");
            profile.setChronicDisease("");
            profile.setSmokingStatus(0);
            profile.setExerciseFrequency("");
            profile.setSystolicBp(null);
            profile.setDiastolicBp(null);
            profile.setFastingGlucose(null);
            profile.setCalorieGoal(1800);
            profile.setCarbGoal(200);
            profile.setProteinGoal(60);
            profile.setFatGoal(60);
            healthProfileMapper.inserthealthprofile(profile);
            user.setProfileId(profile.getProfileId());
            userMapper.update(user);
        }

        return user;
    }


    //社区

    public User getUserInfo(Long userId) {

        return userMapper.getUserInfo(userId);
    }

    public boolean isFollowing(Integer userId, Integer authorId) {
        return userMapper.checkFollow(userId, authorId) > 0;
    }

    public boolean follow(Integer userId, Integer authorId) {
        if (userId.equals(authorId)) return false; // 不能关注自己
        if (isFollowing(userId, authorId)) return false;
        return userMapper.addFollow(userId, authorId) > 0;
    }

    public boolean unfollow(Integer userId, Integer authorId) {
        if (!isFollowing(userId, authorId)) return false;
        return userMapper.removeFollow(userId, authorId) > 0;
    }

    //获取用户的关注列表
    public List<User> getFollowingList(Long userId, int offset, int pageSize) {
        return userMapper.getFollowingList(userId, offset, pageSize);
    }
}
