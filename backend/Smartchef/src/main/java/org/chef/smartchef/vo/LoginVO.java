package org.chef.smartchef.vo;

import lombok.Data;

@Data
public class LoginVO {
    private Integer userId;
    private String nickname;
    private String avatar;
    private Integer profileId;
    private String token;
}
