// 新建一个类用于汇总数据
package org.chef.smartchef.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NutritionSummary {
    private Integer kcal;
    private Integer protein;
    private Integer carb;
    private Integer fat;
}