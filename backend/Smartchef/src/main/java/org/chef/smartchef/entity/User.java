package org.chef.smartchef.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
        private Integer userId;
        private String openid;
        private String nickname;
        private String avatar;
        private Integer profileId;
        private Integer userKey;
        private String password;
}
