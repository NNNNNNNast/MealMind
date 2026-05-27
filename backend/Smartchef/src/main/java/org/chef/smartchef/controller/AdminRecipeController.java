package org.chef.smartchef.controller;

import org.chef.smartchef.entity.Recipe;
import org.chef.smartchef.mapper.RecipeMapper;
import org.chef.smartchef.vo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/recipe")
public class AdminRecipeController {

    @Autowired
    private RecipeMapper recipeMapper;

    //获取所有菜谱列表
    @GetMapping("/list")
    public Result<List<Recipe>> list() {
        try {
            List<Recipe> list = recipeMapper.selectAll();
            return Result.success(list);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    //根据ID获取菜谱详情
    @GetMapping("/{id}")
    public Result<Recipe> getById(@PathVariable Integer id) {
        try {
            Recipe recipe = recipeMapper.getRecipeById(id);
            if (recipe != null) {
                return Result.success(recipe);
            } else {
                return Result.error("菜谱不存在");
            }
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    //创建菜谱
    @PostMapping("/create")
    public Result<Recipe> create(@RequestBody Recipe recipe) {
        try {
            recipeMapper.insert(recipe);
            return Result.success("创建成功", recipe);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    //更新菜谱
    @PutMapping("/{id}")
    public Result<String> update(@PathVariable Integer id, @RequestBody Recipe recipe) {
        try {
            recipe.setRecipeId(id);
            recipeMapper.update(recipe);
            return Result.success("更新成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    //删除菜谱
    @DeleteMapping("/{id}")
    public Result<String> delete(@PathVariable Integer id) {
        try {
            recipeMapper.deleteById(id);
            return Result.success("删除成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}