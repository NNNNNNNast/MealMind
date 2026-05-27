package org.chef.smartchef.service;

import org.chef.smartchef.entity.Recipe;
import org.chef.smartchef.mapper.RecipeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecipeService {

    @Autowired
    private RecipeMapper recipeMapper;

    public List<Recipe> getAllRecipes() {
        return recipeMapper.selectAll();
    }

    public Recipe getRecipeById(Integer recipeId) {
        return recipeMapper.getRecipeById(recipeId);
    }

    public void createRecipe(Recipe recipe) {
        recipeMapper.insert(recipe);
    }

    public void updateRecipe(Recipe recipe) {
        recipeMapper.update(recipe);
    }

    public void deleteRecipe(Integer recipeId) {
        recipeMapper.deleteById(recipeId);
    }
}
