package org.chef.smartchef.controller;

import org.chef.smartchef.entity.Comments;
import org.chef.smartchef.service.CommentsService;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/comment")
public class CommentController {
    @Autowired
    private CommentsService commentsService;

    // 获取帖子评论列表
    @GetMapping("/comments/{postId}")
    public Result<List<Comments>> getComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        int offset = (page - 1) * pageSize;
        List<Comments> comments = commentsService.getComments(postId, offset, pageSize);
        return Result.success(comments);
    }

    // 发布评论
    @PostMapping("/add")
    public Result<Comments> addComment(@RequestBody Map<String, Object> requestBody) {
        try {
            Long postId = ((Number) requestBody.get("postId")).longValue();
            Integer userId = (Integer) requestBody.get("userId");
            String content = (String) requestBody.get("content");

            if (postId == null || userId == null || content == null || content.trim().isEmpty()) {
                return Result.error("参数不完整");
            }

            Comments newComment = commentsService.addComment(postId, userId, content);

            return Result.success(newComment);

        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("评论失败：" + e.getMessage());
        }
    }

    // 删除评论
    @DeleteMapping("/delete/{commentId}")
    public Result<String> deleteComment(@PathVariable Long commentId) {
        try {
            if (commentId == null) {
                return Result.error("评论ID不能为空");
            }

            boolean result = commentsService.deleteComment(commentId);
            if (result) {
                return Result.success("删除成功");
            } else {
                return Result.error("删除失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("删除失败：" + e.getMessage());
        }
    }

    // 点赞评论
    @PostMapping("/like/{commentId}")
    public Result<Map<String, Object>> likeComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> requestBody) {
        try {
            Integer userId = (Integer) requestBody.get("userId");
            Boolean isLiked = (Boolean) requestBody.get("isLiked");

            if (commentId == null || userId == null) {
                return Result.error("参数不完整");
            }

            int newLikeCount = commentsService.likeComment(commentId, userId, isLiked);

            Map<String, Object> result = new HashMap<>();
            result.put("likeCount", newLikeCount);
            result.put("isLiked", isLiked);

            return Result.success(result);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error("操作失败：" + e.getMessage());
        }
    }
}