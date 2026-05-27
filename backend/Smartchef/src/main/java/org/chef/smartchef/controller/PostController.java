package org.chef.smartchef.controller;


import org.chef.smartchef.entity.Post;
import org.chef.smartchef.service.PostService;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/post")
public class PostController {
    @Autowired
    private PostService postService;

    // 原有发布帖子接口
    @PostMapping("/publish")
    public Result<String> publishPost(@RequestBody Post post) {
        try {
            int result = postService.publishPost(post);
            return result > 0 ? Result.success("发布成功") : Result.error("发布失败");
        } catch (Exception e) {
            return Result.error("发布失败：" + e.getMessage());
        }
    }

    //上传图片
        @PostMapping("/uploadImage")
    public Result<String> uploadImage(@RequestParam("file") MultipartFile file) {
        // 1. 检查文件是否为空
        if (file.isEmpty()) {
            return Result.error("文件不能为空");
        }

        // 2. 获取原始文件名和后缀
        String originalFilename = file.getOriginalFilename();
        String suffix = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 3. 生成唯一文件名
        String newFileName = UUID.randomUUID().toString() + suffix;

        // 4. 设置保存路径（项目根目录下的 uploads 文件夹）
        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 5. 保存文件
        File dest = new File(dir, newFileName);
        try {
            file.transferTo(dest);
        } catch (IOException e) {
            e.printStackTrace();
            return Result.error("文件保存失败：" + e.getMessage());
        }

        // 6. 返回可访问的完整URL（假设后端运行在 localhost:8080）
        String url = "http://localhost:8081/uploads/" + newFileName;
        return Result.success(url);
    }


    //点赞
    @PostMapping("/like/{postId}")
    public Result<Integer> likePost(@PathVariable Integer postId) {
        postService.likePost(postId);

        Integer newLikeCount = postService.getLikeCount(postId);

        return Result.success(newLikeCount);
    }

    //取消点赞
    @PostMapping("/unlike/{postId}")
    public Result<Integer> unlikePost(@PathVariable Integer postId) {
        int rows = postService.unlikePost(postId);
        if (rows == 0) {
        }
        Integer newLikeCount = postService.getLikeCount(postId);
        return Result.success(newLikeCount);
    }


    // find社区首页-帖子列表
    @GetMapping("/list")
    public Result<List<Post>> getList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {

        int offset = (page - 1) * size;

        List<Post> posts = postService.getListByPage(offset, size);

        return Result.success(posts);
    }

    //获取前5个点赞最多的帖子
    @GetMapping("/hot")
    public Result<List<Post>> getHotPosts() {
        try {
            List<Post> hotPosts = postService.getTopLikedPosts(5);
            return Result.success(hotPosts);
        } catch (Exception e) {
            return Result.error("获取热门帖子失败：" + e.getMessage());
        }
    }

    //man帖子详情页-帖子和作者的信息
    @GetMapping("/{postId}")
    public Result<List<Post>> getpostinfor(@PathVariable Long postId) {

        // 详情页数据查询
        List<Post> Postinfor = postService.getPosts(postId);
        return Result.success(Postinfor);
    }

    //host作者页面-作者个人帖子列表
    @GetMapping("/user/{userId}")
    public Result<List<Post>> getuserpost(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        int offset = (page - 1) * pageSize;

        List<Post> userpost = postService.getUserList(userId,offset, pageSize);
        return Result.success(userpost);
    }

    @GetMapping("/followedPosts")
    public Result<List<Post>> getFollowedPosts(@RequestParam Long userId) {
        List<Post> postList = postService.getFollowedUserPosts(userId);
        return Result.success(postList);
    }

    //关注作者
    @PostMapping("/follow/{authorId}")
    public Result<String> followAuthor(
            @RequestParam Long userId,
            @PathVariable Long authorId) {
        try {
            postService.followAuthor(userId, authorId);
            return Result.success("关注成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    //取消关注
    @PostMapping("/unfollow/{authorId}")
    public Result<String> unfollowAuthor(
            @RequestParam Long userId,
            @PathVariable Long authorId) {
        try {
            postService.unfollowAuthor(userId, authorId);
            return Result.success("取消关注成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    //查询是否已关注
    @GetMapping("/follow/status/{authorId}")
    public Result<Boolean> getFollowStatus(
            @RequestParam Long userId,
            @PathVariable Long authorId) {
        boolean isFollowed = postService.isFollowed(userId, authorId);
        return Result.success(isFollowed);
    }

    //获取用户帖子总数
    @GetMapping("/user/{userId}/count")
    public Result<Integer> getUserPostCount(@PathVariable Long userId) {
        try {
            int count = postService.countByUserId(userId);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error("获取帖子数量失败：" + e.getMessage());
        }
    }

    //更新帖子
    @PutMapping("/{id}")
    public Result<String> update(@PathVariable Integer id, @RequestBody Post post) {
        try {
            post.setPostId(id);
            int result = postService.updatePost(post);
            if (result > 0) {
                return Result.success("更新成功");
            } else {
                return Result.error("更新失败，帖子不存在");
            }
        } catch (Exception e) {
            return Result.error("更新失败：" + e.getMessage());
        }
    }

    //删除帖子
    @DeleteMapping("/{id}")
    public Result<String> delete(@PathVariable Integer id) {
        try {
            int result = postService.deletePost(id);
            if (result > 0) {
                return Result.success("删除成功");
            } else {
                return Result.error("删除失败，帖子不存在");
            }
        } catch (Exception e) {
            return Result.error("删除失败：" + e.getMessage());
        }
    }
}
