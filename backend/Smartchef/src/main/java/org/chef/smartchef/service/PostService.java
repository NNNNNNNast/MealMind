package org.chef.smartchef.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.chef.smartchef.entity.Post;
import org.chef.smartchef.mapper.PostMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

//帖子业务逻辑服务类
@Service
public class PostService {

    @Autowired
    private PostMapper postMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    //发布新帖子
    public int publishPost(Post post) {
        System.out.println("DEBUG: Service received Post object: " + post);

        //处理 imageUrls，将其转换为 JSON
        String rawImageUrls = post.getImageUrls();
        if (rawImageUrls != null && !rawImageUrls.trim().isEmpty()) {
            try {
                //按逗号分割字符串
                String[] urlArray = rawImageUrls.split(",");

                // 清理空格
                for (int i = 0; i < urlArray.length; i++) {
                    urlArray[i] = urlArray[i].trim();
                }

                //将数组转换为 JSON
                String jsonImageUrls = objectMapper.writeValueAsString(urlArray);

                //设置转换后的 JSON到 Post 对象
                post.setImageUrls(jsonImageUrls);


            } catch (JsonProcessingException e) {
                e.printStackTrace();
                return -1; // 返回 -1 表示转换失败
            }
        }

        if (post.getLikeCount() == null) {
            post.setLikeCount(0);
        }

        int result = 0;
        try {
            result = postMapper.insertPost(post);
        } catch (Exception e) {
            e.printStackTrace();//调试
            return -1;
        }

        return result;
    }

    // 获取所有帖子
    public List<Post> getList() {
        return postMapper.findList();
    }

    // 分页获取帖子列表
    public List<Post> getListByPage(int offset, int limit) {
        return postMapper.getPostsByPage(offset, limit);
    }

    // 根据帖子ID获取帖子详细信息
    public List<Post> getPosts(Long postId) {
        return postMapper.getPostsinfor(postId);
    }

    // 分页获取指定用户的帖子列表
    public List<Post> getUserList(Long userId, int offset, int limit) {
        return postMapper.getUserList(userId, offset, limit);
    }

    // 给指定帖子点赞
    public void likePost(Integer postId) {
        int rows = postMapper.likePost(postId);
        if (rows == 0) {
            throw new RuntimeException("帖子不存在，点赞失败");
        }
    }

    // 获取指定帖子的当前点赞数
    public Integer getLikeCount(Integer postId) {
        return postMapper.getLikeCount(postId);
    }

    // 取消点赞
    public int unlikePost(Integer postId) {
        return postMapper.unlikePost(postId);
    }


    public List<Post> getFollowedUserPosts(Long userId) {
        return postMapper.getFollowedUserPosts(userId);
    }

    //关注作者
    public void followAuthor(Long userId, Long authorId) {
        // 先判断是否已关注，避免重复插入
        if (isFollowed(userId, authorId)) {  // 这里直接用 bool，不用 > 0
            throw new RuntimeException("您已经关注过该作者");
        }
        int rows = postMapper.followAuthor(userId, authorId);
        if (rows == 0) {
            throw new RuntimeException("关注失败");
        }
    }

    //取消关注
    public void unfollowAuthor(Long userId, Long authorId) {
        int rows = postMapper.unfollowAuthor(userId, authorId);
        if (rows == 0) {
            throw new RuntimeException("取消关注失败，您未关注该作者");
        }
    }

    //查询是否已关注
    public boolean isFollowed(Long userId, Long authorId) {
        return postMapper.isFollowed(userId, authorId) > 0;
    }


    //获取点赞最多的前N个帖子
    public List<Post> getTopLikedPosts(int limit) {
        return postMapper.getTopLikedPosts(limit);
    }

    //统计用户的帖子数量
    public int countByUserId(Long userId) {
        return postMapper.countByUserId(userId);
    }

    //更新帖子
    public int updatePost(Post post) {
        String rawImageUrls = post.getImageUrls();
        if (rawImageUrls != null && !rawImageUrls.trim().isEmpty()) {
            try {
                if (!rawImageUrls.trim().startsWith("[")) {
                    String[] urlArray = rawImageUrls.split(",");
                    for (int i = 0; i < urlArray.length; i++) {
                        urlArray[i] = urlArray[i].trim();
                    }
                    rawImageUrls = objectMapper.writeValueAsString(urlArray);
                    post.setImageUrls(rawImageUrls);
                }
            } catch (JsonProcessingException e) {
                e.printStackTrace();
                return -1;
            }
        }
        return postMapper.update(post);
    }

    //删除帖子
    public int deletePost(Integer postId) {
        return postMapper.deleteById(postId);
    }
}