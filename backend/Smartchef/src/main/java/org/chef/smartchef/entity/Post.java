package org.chef.smartchef.entity;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    private Integer postId;
    private Integer userId;
    private String imageUrls;
    private String content;
    private Integer likeCount;
    private Timestamp createdAt;
    private String title;
    private String nickname;
    private String avatar;

}
