package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.User;

import java.util.List;

@Mapper
public interface UserMapper {

    //用户
    //根据openid获取user
    @Select("SELECT * FROM users WHERE openid = #{openid}")
    User findByOpenid(String openid);

    //根据user_id查
    @Select("SELECT * FROM users WHERE user_id = #{userId}")
    User findById(Integer userId);

    //插入
    @Insert("INSERT INTO users (openid, nickname, avatar, user_key) " +
            "VALUES (#{openid}, #{nickname}, #{avatar}, #{userKey})")
    @Options(useGeneratedKeys = true, keyProperty = "userId", keyColumn = "user_id")
    int insert(User user);

    //跟新
    @Update("UPDATE users SET nickname = #{nickname}, avatar = #{avatar} WHERE user_id = #{userId}")
    int update(User user);

    //admin
    //查询管理员
    @Select("SELECT * FROM users WHERE nickname = #{nickname} AND password = #{password} AND user_key >= 1")
    User findByNicknameAndPassword(@Param("nickname") String nickname, @Param("password") String password);


    @Select("SELECT * FROM users ORDER BY user_id DESC")
    List<User> selectAll();


    @Select("SELECT * FROM users WHERE nickname LIKE CONCAT('%', #{keyword}, '%') OR openid LIKE CONCAT('%', #{keyword}, '%')")
    List<User> searchByKeyword(String keyword);

    @Update("UPDATE users SET status = #{status} WHERE user_id = #{id}")
    void updateStatus(@Param("id") Integer id, @Param("status") Integer status);

    @Update("UPDATE users SET user_key = #{userKey} WHERE user_id = #{id}")
    void updateUserKey(@Param("id") Integer id, @Param("userKey") Integer userKey);



    //社区

    @Select("SELECT user_id AS userId, nickname, avatar, profile_id AS profileId " +
            "FROM users WHERE user_id = #{userId}"
    )
    User getUserInfo(Long userId);

    // 检查是否关注
    @Select("SELECT COUNT(*) FROM user_follow WHERE user_id = #{userId} AND author_id = #{followUserId}")
    int checkFollow(@Param("userId") Integer userId, @Param("followUserId") Integer followUserId);

    // 关注
    @Insert("INSERT INTO user_follow (user_id, author_id) VALUES (#{userId}, #{followUserId})")
    int addFollow(@Param("userId") Integer userId, @Param("followUserId") Integer followUserId);

    // 取消关注
    @Delete("DELETE FROM user_follow WHERE user_id = #{userId} AND author_id = #{followUserId}")
    int removeFollow(@Param("userId") Integer userId, @Param("followUserId") Integer followUserId);

    // 获取用户的关注列表
    @Select("SELECT u.user_id AS userId, u.nickname, u.avatar, u.profile_id AS profileId " +
            "FROM user_follow f " +
            "JOIN users u ON f.author_id = u.user_id " +
            "WHERE f.user_id = #{userId} " +
            "ORDER BY f.author_id DESC " +
            "LIMIT #{offset}, #{limit}")
    List<User> getFollowingList(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int pageSize);
}
