const request = require('../../utils/request');
const app = getApp();

Page({
  data: {
    isFavorite: false,
    recipeId: null,
    recipe: {
      imageUrl: '',
      title: '',
      cookTime: '',
      difficultyLevel: '',
      cookingMethod: '',
      cuisine: '',
      ingredients: [],
      steps: [],
      tips: ''
    },
    StatusBar: 0,
    CustomBar: 0,
    loading: true
  },

  // 获取食谱详情
  async getDetail() {
    const recipeId = this.data.recipeId;
    console.log('获取菜谱详情:', recipeId);
    
    if (!recipeId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await request.get('/recipe/id', { recipeId: recipeId });
      
      if (res.code === 200) {
        let data = res.data;
        
        if (!data) {
          wx.showToast({ title: '数据加载失败', icon: 'none' });
          this.setData({ loading: false });
          return;
        }

        // 基础数据设置
        this.setData({ recipe: data });

        // 处理工艺和口味
        const method = ['炒锅', '蒸锅', '电饭煲', '平底锅', '煮锅', '汤锅', '烤箱', '模具'];
        const cui = ['咸香', '麻辣', '原味', '果味', '微辣', '酸甜', '酸辣', '清淡', '奶香'];

        let cookingMethod = '';
        let cuit = '';
        const generalTags = data.generalTags || data.general_tags || [];

        for (const item of generalTags) {
          if (method.includes(item)) {
            cookingMethod = item;
            break;
          }
        }

        for (const item of generalTags) {
          if (cui.includes(item)) {
            cuit = item;
            break;
          }
        }

        if (cookingMethod) {
          this.setData({ 'recipe.cookingMethod': cookingMethod });
        }
        if (cuit) {
          this.setData({ 'recipe.cuisine': cuit });
        }

        // 处理难度
        const tagMap = {
          'easy': '简单',
          'medium': '中等',
          'hard': '困难'
        };
        const diff = tagMap[data.difficultyLevel] || '未知';
        this.setData({ 'recipe.difficultyLevel': diff });

        // 处理食材
        let foods = [];
        const ingredients = data.ingredients || [];

        if (Array.isArray(ingredients)) {
          if (ingredients.length > 0 && typeof ingredients[0] === 'object') {
            for (let i = 0; i < ingredients.length; i++) {
              foods.push({
                0: ingredients[i].name || ingredients[i].ingredient || '',
                1: ingredients[i].amount || ingredients[i].quantity || '',
                checked: false
              });
            }
          } else if (typeof ingredients[0] === 'string') {
            for (let i = 0; i < ingredients.length; i += 2) {
              foods.push({
                0: ingredients[i],
                1: ingredients[i + 1] || '',
                checked: false
              });
            }
          }
        }
        
        this.setData({ 'recipe.ingredients': foods });

        // 处理步骤
        let steps = [];
        const paces = data.steps || [];

        if (Array.isArray(paces)) {
          if (paces.length > 0 && typeof paces[0] === 'object') {
            for (let i = 0; i < paces.length; i++) {
              steps.push({
                0: paces[i].description || paces[i].step || paces[i].content || '',
                1: false
              });
            }
          } else if (typeof paces[0] === 'string') {
            for (let i = 0; i < paces.length; i++) {
              steps.push({
                0: paces[i],
                1: false
              });
            }
          }
        }
        
        this.setData({ 'recipe.steps': steps });
        console.log('菜谱加载成功:', data.title);
      } else {
        console.error('加载失败:', res.msg);
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('请求失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 更新浏览记录
  async updateHistory() {
    const recipeId = this.data.recipeId;
    if (!recipeId) return;

    try {
      await request.post(`/user_record/updatehistory?recipeId=${recipeId}`, {});
      console.log('历史记录已更新');
    } catch (err) {
      console.error('历史记录更新失败:', err);
    }
  },

  // 查询是否收藏
  async checkFavorite() {
    const recipeId = this.data.recipeId;
    if (!recipeId) return;

    try {
      const res = await request.get('/user_record/favorite', { recipeId: recipeId });
      
      if (res.code === 200) {
        this.setData({ isFavorite: res.data === true || res.data === 'true' });
      }
    } catch (err) {
      console.error('查询收藏失败:', err);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 切换收藏
  async toggleFavorite() {
    const recipeId = this.data.recipeId;
    if (!recipeId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }

    const url = this.data.isFavorite ? '/user_record/deletefavorite' : '/user_record/updatefavorite';

    try {
      const res = await request.post(`${url}?recipeId=${recipeId}`, {});
      
      if (res.code === 200) {
        const newStatus = !this.data.isFavorite;
        this.setData({ isFavorite: newStatus });
        wx.showToast({ 
          title: newStatus ? '已收藏' : '已取消收藏', 
          icon: 'success' 
        });
      } else {
        wx.showToast({ title: res.msg || '操作失败', icon: 'none' });
      }
    } catch (err) {
      console.error('操作失败:', err);
      wx.showToast({ title: '网络错误', icon: 'error' });
    }
  },

  // 勾选食材
  toggleIngredient(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.recipe.ingredients;
    if (ingredients && ingredients[index]) {
      ingredients[index].checked = !ingredients[index].checked;
      this.setData({ 'recipe.ingredients': ingredients });
    }
  },

  // 勾选步骤
  toggleSteps(e) {
    const index = e.currentTarget.dataset.index;
    const steps = this.data.recipe.steps;
    if (steps && steps[index]) {
      steps[index].checked = !steps[index].checked;
      this.setData({ 'recipe.steps': steps });
    }
  },

  onLoad(options) {
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar,
      searchWidth: app.globalData.searchWidth,
      menuButtonInfo: app.globalData.menuButtonInfo
    });

    if (options.recipeId) {
      this.setData({ recipeId: options.recipeId });
    } else {
      console.error('未接收到 recipeId 参数');
    }

    this.getDetail();
    this.checkFavorite();
    this.updateHistory();
  },

  onShow() {
    if (this.data.recipeId) {
      this.checkFavorite();
    }
  }
});