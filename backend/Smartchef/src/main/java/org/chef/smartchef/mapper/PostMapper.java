package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.Post;
import java.util.List;

@Mapper
public interface PostMapper {

    @Insert("INSERT INTO post (user_id, title, content, image_urls, like_count, created_at) " +
            "VALUES (#{userId}, #{title}, #{content}, #{imageUrls}, #{likeCount}, #{createdAt})")
    @Options(useGeneratedKeys = true, keyProperty = "postId") // 假设 postId 是自增主键，需要回填到对象中
    int insertPost(Post post);


    @Select("SELECT p.post_id, p.user_id, p.image_urls, p.like_count, p.created_at, p.title, u.nickname, u.avatar " +
            "FROM post p " +
            "LEFT JOIN users u ON p.user_id = u.user_id " +
            "ORDER BY p.created_at DESC")
    List<Post> findList();

    @Select("SELECT p.post_id, p.user_id, p.image_urls, p.content, p.like_count, p.created_at, p.title, " +
            "u.nickname, u.avatar " +
            "FROM post p " +
            "LEFT JOIN users u ON p.user_id = u.user_id " +
            "ORDER BY p.like_count DESC, p.created_at DESC " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<Post> getPostsByPage(@Param("offset") int offset, @Param("limit") int limit);

    @Update("UPDATE post SET like_count = like_count + 1 WHERE post_id = #{postId}")
    int likePost(@Param("postId") Integer postId);

    @Select("SELECT like_count FROM post WHERE post_id = #{postId}")
    Integer getLikeCount(@Param("postId") Integer postId);

    @Update("UPDATE post SET like_count = like_count - 1 WHERE post_id = #{postId} AND like_count > 0")
    int unlikePost(@Param("postId") Integer postId);

    @Select("SELECT " +
            "p.post_id, " +
            "p.title, " +
            "p.content, " +
            "p.image_urls, " +
            "p.like_count, " +
            "p.created_at, " +
            "u.user_id, " +
            "u.nickname, " +
            "u.avatar " +
            "FROM post p " + // 注意：表名应为小写的 'post'，与SQL语句规范一致
            "LEFT JOIN users u ON p.user_id = u.user_id " +
            "WHERE p.post_id = #{postId}")
    List<Post> getPostsinfor(@Param("postId") Long postId);

    @Select("SELECT p.post_id, p.user_id, p.image_urls, p.content, p.like_count, p.created_at, p.title, " +
            "u.nickname, u.avatar " +
            "FROM post p " +
            "LEFT JOIN users u ON p.user_id = u.user_id " +
            "WHERE p.user_id = #{userId} " +
            "LIMIT #{limit} OFFSET #{offset}")
    List<Post> getUserList(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int limit);

    @Select("<script>"
            + "SELECT p.post_id, p.user_id, p.image_urls, p.content, p.like_count, p.created_at, p.title, "
            + "u.nickname, u.avatar "
            + "FROM post p "
            + "LEFT JOIN users u ON p.user_id = u.user_id "
            + "WHERE p.user_id IN ("
            + "    SELECT author_id FROM user_follow WHERE user_id = #{userId}"
            + ") "
            + "ORDER BY p.created_at DESC"
            + "</script>")
    List<Post> getFollowedUserPosts(@Param("userId") Long userId);
// 关注作者
    @Insert("INSERT INTO user_follow (user_id, author_id) VALUES (#{userId}, #{authorId})")
    int followAuthor(@Param("userId") Long userId, @Param("authorId") Long authorId);

    // 取消关注
    @Delete("DELETE FROM user_follow WHERE user_id = #{userId} AND author_id = #{authorId}")
    int unfollowAuthor(@Param("userId") Long userId, @Param("authorId") Long authorId);

    // 查询是否已关注
    @Select("SELECT COUNT(*) FROM user_follow WHERE user_id = #{userId} AND author_id = #{authorId}")
    int isFollowed(@Param("userId") Long userId, @Param("authorId") Long authorId);


    // 获取点赞最多的前N个帖子
    @Select("SELECT p.post_id, p.user_id, p.image_urls, p.content, p.like_count, p.created_at, p.title, " +
            "u.nickname, u.avatar " +
            "FROM post p " +
            "LEFT JOIN users u ON p.user_id = u.user_id " +
            "ORDER BY p.like_count DESC, p.created_at DESC " +
            "LIMIT #{limit}")
    List<Post> getTopLikedPosts(@Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM post WHERE user_id = #{userId}")
    int countByUserId(@Param("userId") Long userId);

    // 更新帖子
    @Update("UPDATE post SET title = #{title}, content = #{content}, image_urls = #{imageUrls}, like_count = #{likeCount} WHERE post_id = #{postId}")
    int update(Post post);

    // 删除帖子
    @Delete("DELETE FROM post WHERE post_id = #{postId}")
    int deleteById(Integer postId);
}