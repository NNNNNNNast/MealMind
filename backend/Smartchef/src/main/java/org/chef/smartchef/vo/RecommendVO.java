package org.chef.smartchef.vo;

import lombok.Data;

@Data
public class RecommendVO {
    private Integer recipeId;
    private String title;
    private String imageUrl;
    private String description;
    private String cookTime;
    private String difficultyLevel;
    private String recommendReason;
    private String matchedTag;
}