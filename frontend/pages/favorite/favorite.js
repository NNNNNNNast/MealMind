const app = getApp();
const Auth = require('../../utils/auth');
const { get, post } = require('../../utils/request');

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: true,
    loadingMore: false,
    StatusBar: 0,
    CustomBar: 0
  },

  onLoad() {
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });
    this.init();
  },

  async init() {
    if (Auth.isLogin()) {
      this.loadFavorites(true);
    } else {
      await app.waitForLogin();
      this.loadFavorites(true);
    }
  },

  // 加载收藏列表
  async loadFavorites(reset = false) {
    if (reset) {
      this.setData({ page: 1, list: [], hasMore: true });
    }
    
    if (!this.data.hasMore) return;
    
    if (!Auth.isLogin()) {
      this.setData({ loading: false, loadingMore: false });
      return;
    }
    
    this.setData({ 
      loading: reset ? true : false, 
      loadingMore: !reset 
    });
    
    try {
      const res = await get('/user_record/favorites');
      
      if (res && res.code === 200) {
        let favorites = res.data || [];
        
        let total = 0;
        if (Array.isArray(favorites)) {
          total = favorites.length;
        } else if (favorites.records) {
          total = favorites.total;
          favorites = favorites.records;
        }
        
        const start = (this.data.page - 1) * this.data.pageSize;
        const end = start + this.data.pageSize;
        const newList = favorites.slice(start, end);
        
        const hasMore = end < total;
        
        this.setData({
          list: reset ? newList : [...this.data.list, ...newList],
          hasMore: hasMore,
          page: this.data.page + 1,
          loading: false,
          loadingMore: false
        });
      } else {
        this.setData({ loading: false, loadingMore: false });
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      this.setData({ loading: false, loadingMore: false });
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadFavorites();
    }
  },

  onPullDownRefresh() {
    this.loadFavorites(true);
    wx.stopPullDownRefresh();
  },

  goBack() {
    wx.navigateBack();
  },

  goToRecipe(e) {
    const recipeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/card/card?recipeId=${recipeId}`
    });
  },

  // 取消收藏
  async unfavorite(e) {
    const recipeId = e.currentTarget.dataset.id;
    const userId = Auth.getUserId();
    const token = Auth.getToken();
    
    wx.showModal({
      title: '提示',
      content: '确定取消收藏该食谱吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '操作中...', mask: true });
          
          try {
            const result = await new Promise((resolve, reject) => {
              wx.request({
                url: 'http://8.141.127.94:8081/user_record/deletefavorite',
                method: 'POST',
                header: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'satoken': token
                },
                data: `recipeId=${recipeId}&userId=${userId}`,
                success: (response) => {
                  if (response.statusCode === 200) {
                    resolve(response.data);
                  } else {
                    reject(response);
                  }
                },
                fail: reject
              });
            });
            
            wx.hideLoading();
            
            if (result && result.code === 200) {
              wx.showToast({ title: '已取消收藏', icon: 'success' });
              this.loadFavorites(true);
            } else {
              wx.showToast({ title: result?.msg || '操作失败', icon: 'none' });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('取消收藏失败:', error);
            wx.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  }
});