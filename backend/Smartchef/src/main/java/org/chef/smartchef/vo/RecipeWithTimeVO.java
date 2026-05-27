package org.chef.smartchef.vo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeWithTimeVO {
    private Integer recipeId;
    private String title;
    private String imageUrl;
    private LocalDateTime viewTime;  // 最近访问时间
}