package org.chef.smartchef.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recipe {
    private Integer recipeId;
    private String title;
    private String imageUrl;
    private List<String> ingredients;
    private List<String> steps;
    private String tips;
    private List<String> generalTags;
    private String difficultyLevel;
    private String cookTime;
}