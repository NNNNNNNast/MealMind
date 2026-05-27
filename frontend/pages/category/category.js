const app = getApp();
const baseUrl = 'http://localhost:8081';
const Auth = require('../../utils/auth');

Page({
  data: {
    StatusBar: 0,
    CustomBar: 0,

    selectedFilters: {
      taste: [],      // 口味
      method: [],     // 烹饪工艺
      time: [],       // 烹饪时间
      difficulty: [], // 难度
      hot: []         // 热量分类
    },

    // 菜系列表
    cuisines: [
      { id: 'all', name: '全部' },
      { id: '热菜', name: '热菜' },
      { id: '主食', name: '主食' },
      { id: '汤羹', name: '汤羹' },
      { id: '小吃', name: '小吃' },
      { id: '海鲜', name: '海鲜' },
      { id: '家常菜', name: '家常菜' },
      { id: '平底锅', name: '平底锅' },
      { id: '川菜', name: '川菜' },
      { id: '凉菜', name: '凉菜' },
      { id: '烤箱菜', name: '烤箱菜' }
    ],

    // 筛选选项
    filterOptions: {
      taste: [
        { id: '咸香', name: '咸香' },
        { id: '麻辣', name: '麻辣' },
        { id: '原味', name: '原味' },
        { id: '果味', name: '果味' },
        { id: '微辣', name: '微辣' },
        { id: '酸甜', name: '酸甜' },
        { id: '酸辣', name: '酸辣' },
        { id: '清淡', name: '清淡' }
      ],
      method: [
        { id: '炖', name: '炖' },
        { id: '炒', name: '炒' },
        { id: '蒸', name: '蒸' },
        { id: '焖', name: '焖' },
        { id: '煮', name: '煮' },
        { id: '煎', name: '煎' },
        { id: '拌', name: '拌' },
        { id: '烤', name: '烤' },
        { id: '其他', name: '其他' }
      ],
      time: [
        { id: '10分钟', name: '10分钟' },
        { id: '廿分钟', name: '廿分钟' },
        { id: '半小时', name: '半小时' },
        { id: '三刻钟', name: '三刻钟' },
        { id: '一小时', name: '一小时' },
        { id: '一天', name: '一天' }
      ],
      difficulty: [
        { id: 'easy', name: '简单' },
        { id: 'medium', name: '中等' },
        { id: 'hard', name: '困难' }
      ],
      hot: [
        { id: '低卡', name: '低卡' },
        { id: '高卡', name: '高卡' }
      ]
    },

    // 筛选分类
    filterCategories: [
      { id: 'taste', name: '口味' },
      { id: 'method', name: '工艺' },
      { id: 'time', name: '时间' },
      { id: 'difficulty', name: '难度' },
      { id: 'hot', name: '热量' }
    ],

    // 选中的菜系tab
    selectedCuisine: 'all',
    
    // 当前选中的筛选tab
    currentFilterTab: 'taste',

    // 获得的食谱列表
    recipes: [],
    loading: false,
    page: 1,
    hasMore: true,
    pageSize: 10
  },

  onLoad(options) {
    
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });

    if (options && options.selectedCuisine) {
      this.setData({
        selectedCuisine: options.selectedCuisine 
      });
      console.log("接收到的菜系:", options.selectedCuisine);
    }

    this.loadRecipes(true);
  },

  // 切换筛选tab
  switchFilterTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log("切换筛选tab:", tab);
    this.setData({
      currentFilterTab: tab
    });
  },

  // 切换筛选条件
  toggleFilter(e) {
    const { type, id } = e.currentTarget.dataset;
    console.log("切换筛选:", type, id);
    
    if (!type) {
      console.error("toggleFilter: type 为空");
      return;
    }
    
    const selectedFilters = { ...this.data.selectedFilters };
    
    if (!selectedFilters[type]) {
      selectedFilters[type] = [];
    }
    
    const currentFilter = selectedFilters[type];
    
    if (currentFilter.length === 1 && currentFilter[0] === id) {
      selectedFilters[type] = [];
    } else {
      selectedFilters[type] = [id];
    }
    
    this.setData({ 
      selectedFilters,
      page: 1,
      hasMore: true
    });
    console.log("当前筛选条件:", selectedFilters);
    
    this.loadRecipes(true);
  },

  // 选择菜系
  selectCuisine(e) {
    const cuisine = e.currentTarget.dataset.cuisine;
    console.log("选择菜系:", cuisine);
    
    this.setData({
      selectedCuisine: cuisine,
      page: 1,
      hasMore: true
    });
    
    this.loadRecipes(true);
  },

  // 加载食谱列表
  loadRecipes(reset = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    const { selectedCuisine, selectedFilters, page, pageSize } = this.data;
  
    let allTags = [];
    
    Object.keys(selectedFilters).forEach(key => {
      allTags = [...allTags, ...selectedFilters[key]];
    });
    
    if (selectedCuisine && selectedCuisine !== 'all' && selectedCuisine !== '更多'){
      allTags.push(selectedCuisine);
    }
    
    console.log("请求参数:", { tags: allTags, page, size: pageSize });
    
    const requestData = {
      page: page,
      size: pageSize
    };
    
    if (allTags.length > 0) {
      requestData.tags = allTags.join(',');
    }
    
    wx.request({
      url: baseUrl + '/recipe/tags',
      method: 'GET',
      data: requestData,
      success: (res) => {
        console.log("食谱请求成功:", res.data);
        
        let newRecipes = [];
        let hasMore = false;
        
        if (res.statusCode === 200) {
          if (Array.isArray(res.data)) {
            newRecipes = res.data;
            hasMore = newRecipes.length === pageSize;
          }
          else if (res.data && res.data.code === 0 && Array.isArray(res.data.data)) {
            newRecipes = res.data.data;
            hasMore = newRecipes.length === pageSize;
          }
          else if (res.data && Array.isArray(res.data.data)) {
            newRecipes = res.data.data;
            hasMore = newRecipes.length === pageSize;
          }
        }
        
        console.log("获取到食谱数量:", newRecipes.length, "是否还有更多:", hasMore);
        
        this.setData({
          recipes: reset ? newRecipes : [...this.data.recipes, ...newRecipes],
          loading: false,
          hasMore: hasMore
        });
      },
      fail: (err) => {
        console.error("食谱请求失败:", err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  // 加载更多
  loadMore() {
    if (this.data.loading || !this.data.hasMore) {
      console.log("无法加载更多: loading=", this.data.loading, "hasMore=", this.data.hasMore);
      return;
    }
    
    console.log("加载更多, 当前页码:", this.data.page);
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.loadRecipes(false);
  },

  // 清除所有筛选条件
  clearAllFilters() {
    console.log("清除所有筛选条件");
    
    this.setData({
      selectedFilters: {
        taste: [],
        method: [],
        time: [],
        difficulty: [],
        hot: []
      },
      page: 1,
      hasMore: true
    });
    
    this.loadRecipes(true);
    
    wx.showToast({ title: '已清除筛选', icon: 'none' });
  },

  // 点击食谱项，跳转到详情页
  onRecipeTap(e) {
    const recipe = e.currentTarget.dataset.recipe;
    console.log("点击食谱:", recipe);
    
    const recipeId = recipe.recipeId || recipe.recipe_id || recipe.id;
    
    if (recipeId) {
      wx.navigateTo({
        url: `/pages/card/card?recipeId=${recipeId}`
      });
    } else {
      console.error("食谱ID不存在:", recipe);
      wx.showToast({ title: '获取食谱信息失败', icon: 'none' });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 页面触底事件
  onReachBottom() {
    console.log("触底加载更多");
    this.loadMore();
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log("下拉刷新");
    this.setData({ 
      page: 1, 
      hasMore: true 
    });
    this.loadRecipes(true);
    wx.stopPullDownRefresh();
  }
});