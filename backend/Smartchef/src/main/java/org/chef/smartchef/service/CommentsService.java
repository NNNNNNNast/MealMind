package org.chef.smartchef.service;

import org.chef.smartchef.entity.Comments;
import org.chef.smartchef.mapper.CommentsMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;

@Service
public class CommentsService {

    @Autowired
    private CommentsMapper commentsMapper;

    public List<Comments> getComments(Long postId, int offset, int limit) {
        return commentsMapper.getComments(postId, offset, limit);
    }

    @Transactional
    public Comments addComment(Long postId, Integer userId, String content) {
        if (postId == null || userId == null || content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("参数不完整");
        }

        Comments comment = Comments.builder()
                .postId(postId.intValue())
                .commentUserId(userId)
                .commentContent(content.trim())
                .commentLike(0)
                .commentTime(new Timestamp(System.currentTimeMillis()))
                .build();

        int result = commentsMapper.addComment(comment);

        if (result > 0 && comment.getCommentId() != null) {
            Comments newComment = commentsMapper.getCommentById(comment.getCommentId().longValue());
            return newComment;
        }

        throw new RuntimeException("评论失败");
    }

    @Transactional
    public boolean deleteComment(Long commentId) {
        return commentsMapper.deleteComment(commentId) > 0;
    }

    @Transactional
    public int likeComment(Long commentId, Integer userId, Boolean isLiked) {
        Comments comment = commentsMapper.getCommentById(commentId);
        if (comment == null) {
            throw new IllegalArgumentException("评论不存在");
        }

        int newLikeCount;
        if (isLiked) {
            // 点赞：like_count + 1
            newLikeCount = (comment.getCommentLike() != null ? comment.getCommentLike() : 0) + 1;
            commentsMapper.updateCommentLikeCount(commentId, newLikeCount);
        } else {
            // 取消点赞：like_count - 1
            newLikeCount = Math.max(0, (comment.getCommentLike() != null ? comment.getCommentLike() : 0) - 1);
            commentsMapper.updateCommentLikeCount(commentId, newLikeCount);
        }

        return newLikeCount;
    }
}