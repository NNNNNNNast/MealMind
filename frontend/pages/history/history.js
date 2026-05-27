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
      this.loadHistory(true);
    } else {
      await app.waitForLogin();
      this.loadHistory(true);
    }
  },

  async loadHistory(reset = false) {
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
      const res = await get('/user_record/gethistory', {
        page: this.data.page,
        pageSize: this.data.pageSize
      });
      
      if (res && res.code === 200) {
        let recipes = res.data || [];
        
        let total = 0;
        if (Array.isArray(recipes)) {
          total = recipes.length;
        } else if (recipes.records) {
          total = recipes.total;
          recipes = recipes.records;
        }
        
        const formattedList = recipes.map(item => ({
          ...item,
          formattedTime: this.formatTime(item.viewTime || item.createdAt)
        }));
        
        const hasMore = this.data.page * this.data.pageSize < total;
        
        this.setData({
          list: reset ? formattedList : [...this.data.list, ...formattedList],
          hasMore: hasMore,
          page: this.data.page + 1,
          loading: false,
          loadingMore: false
        });
      } else {
        this.setData({ loading: false, loadingMore: false, hasMore: false });
      }
    } catch (error) {
      console.error('加载浏览记录失败:', error);
      this.setData({ loading: false, loadingMore: false });
    }
  },

  formatTime(time) {
    if (!time) return '';
    
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadHistory();
    }
  },

  onPullDownRefresh() {
    this.loadHistory(true);
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

  // 删除单条浏览记录
  async deleteHistory(e) {
    const recipeId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这条浏览记录吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...', mask: true });
          
          try {
            const token = Auth.getToken();
            const userId = Auth.getUserId();
            
            const result = await new Promise((resolve, reject) => {
              wx.request({
                url: 'http://8.141.127.94:8081/user_record/deletehistory',
                method: 'POST',
                header: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'satoken': token
                },
                data: `recipeId=${recipeId}&userId=${userId}`,
                success: (res) => {
                  if (res.statusCode === 200) {
                    resolve(res.data);
                  } else {
                    reject(res);
                  }
                },
                fail: reject
              });
            });
            
            wx.hideLoading();
            
            if (result && result.code === 200) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadHistory(true);
            } else {
              wx.showToast({ title: result?.msg || '删除失败', icon: 'none' });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('删除失败:', error);
            wx.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  },

  // 清空所有记录
  async clearAllHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有浏览记录吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清空中...', mask: true });
          
          try {
            const userId = Auth.getUserId();
            const result = await post('/user_record/clearhistory', { userId: userId });
            
            wx.hideLoading();
            
            if (result && result.code === 200) {
              wx.showToast({ title: '清空成功', icon: 'success' });
              this.setData({ list: [], hasMore: false, page: 1 });
            } else {
              wx.showToast({ title: result?.msg || '清空失败', icon: 'none' });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('清空失败:', error);
            wx.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  }
});