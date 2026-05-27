package org.chef.smartchef.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

/**
 * 评论实体类 (适配当前查询)
 * 包含评论本身、其作者信息以及所属的帖子ID。
 * 不包含帖子的详细信息（如标题、内容等）。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comments {

    private Integer commentId;
    private String commentContent;
    private Integer commentLike;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Timestamp commentTime;

    private Integer commentUserId;
    private String commentUserName;
    private String commentUserAvatar;
    private Integer postId;
}