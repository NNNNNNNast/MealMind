package org.chef.smartchef.mapper;

import org.apache.ibatis.annotations.*;
import org.chef.smartchef.entity.Comments;
import java.util.List;

@Mapper
public interface CommentsMapper {

        @Select("SELECT " +
                "c.comment_id AS commentId, " +
                "c.content AS commentContent, " +
                "c.like_count AS commentLike, " +
                "c.created_at AS commentTime, " +
                "c.user_id AS commentUserId, " +
                "cu.nickname AS commentUserName, " +
                "cu.avatar AS commentUserAvatar, " +
                "c.post_id AS postId " +
                "FROM comments c " +
                "LEFT JOIN users cu ON c.user_id = cu.user_id " +
                "WHERE c.post_id = #{postId} " +
                "ORDER BY c.created_at ASC " +
                "LIMIT #{limit} OFFSET #{offset}")
        List<Comments> getComments(@Param("postId") Long postId,
                                   @Param("offset") int offset,
                                   @Param("limit") int limit);

        @Insert("INSERT INTO comments (post_id, user_id, content, like_count, created_at) " +
                "VALUES (#{postId}, #{commentUserId}, #{commentContent}, 0, NOW())")
        @Options(useGeneratedKeys = true, keyProperty = "commentId", keyColumn = "comment_id")
        int addComment(Comments comment);

        @Select("SELECT " +
                "c.comment_id AS commentId, " +
                "c.content AS commentContent, " +
                "c.like_count AS commentLike, " +
                "c.created_at AS commentTime, " +
                "c.user_id AS commentUserId, " +
                "cu.nickname AS commentUserName, " +
                "cu.avatar AS commentUserAvatar, " +
                "c.post_id AS postId " +
                "FROM comments c " +
                "LEFT JOIN users cu ON c.user_id = cu.user_id " +
                "WHERE c.comment_id = #{commentId}")
        Comments getCommentById(@Param("commentId") Long commentId);

        @Delete("DELETE FROM comments WHERE comment_id = #{commentId}")
        int deleteComment(@Param("commentId") Long commentId);

        @Select("SELECT like_count FROM comments WHERE comment_id = #{commentId}")
        int getCommentLikeCount(@Param("commentId") Long commentId);

        // 更新评论点赞数
        @Update("UPDATE comments SET like_count = #{likeCount} WHERE comment_id = #{commentId}")
        int updateCommentLikeCount(@Param("commentId") Long commentId, @Param("likeCount") int likeCount);
}