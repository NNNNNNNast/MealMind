const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    keyword: '',
    searchResults: [],
    loading: false,
    StatusBar: 0,
    CustomBar: 0,
    resultStr: '',
  },

  onLoad(options) {
    const keyword = decodeURIComponent(options.keyword || '菠菜');

    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    })
    
    if (keyword) {
      this.setData({ keyword });
      wx.setNavigationBarTitle({
        title: `搜索: ${keyword}`
      });
    }
    this.onSearch(keyword);
  },

  // 搜索函数
  async onSearch(keyword) {
    console.log("开始搜索，关键词:", keyword);
    
    this.setData({ loading: true });
    
    try {
      const res = await request({
        url: '/recipe/keyword',
        method: 'GET',
        data: {
          keyword: keyword
        }
      });
      
      console.log("搜索响应:", res);
      
      if (res.code === 200) {
        const recipes = res.data || [];
        console.log("搜索结果数量:", recipes.length);
        
        this.setData({
          searchResults: recipes,
          resultStr: recipes,
          loading: false
        });
        
        if (recipes.length === 0) {
          wx.showToast({
            title: '未找到相关菜谱',
            icon: 'none'
          });
        }
      } else {
        console.error("搜索失败:", res.msg);
        this.setData({ loading: false });
        wx.showToast({
          title: res.msg || '搜索失败',
          icon: 'none'
        });
      }
      
    } catch (err) {
      console.error('搜索请求失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }
  },

  goBack() {
    console.log("返回上一级");
    wx.navigateBack({
      delta: 1
    });
  },

  getDetail(e) {
    const recipeId = e.currentTarget.dataset.id;
    console.log('点击菜谱:', recipeId);
    wx.navigateTo({
      url: `/pages/card/card?recipeId=${recipeId}`
    });
  }
})