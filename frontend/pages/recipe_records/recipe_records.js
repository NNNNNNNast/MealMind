// pages/ai/kitchen/recipe_records/recipe_records.js
const API_CONFIG = {
  baseURL: 'http://localhost:8081'
};

const TEST_USER_ID = '0007';

Page({


  data: {
    records: [],
    isLoading: false,
    hasError: false,
    errorMsg: '',
    selectedRecord: null,
    showDetail: false,
    CustomBar: 0,
    StatusBar: 0
  },


  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const customBarHeight = systemInfo.screenHeight - systemInfo.windowHeight - statusBarHeight;
    
    this.setData({
      StatusBar: statusBarHeight,
      CustomBar: customBarHeight + statusBarHeight
    });
    
    this.loadRecords();
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },


  loadRecords() {
    const that = this;

    this.setData({
      isLoading: true,
      hasError: false
    });

    wx.request({
      url: `${API_CONFIG.baseURL}/api/recipe-records/user/${TEST_USER_ID}`,
      method: 'GET',
      success: (res) => {
        console.log('获取记录响应:', res);
        if (res.statusCode === 200 && res.data.code === 200) {
          const records = res.data.data || [];
          const processedRecords = records.map(record => {
            return {
              ...record,
              dishName: that.extractDishName(record.content),
              formattedTime: that.formatTime(record.recordTime)
            };
          });

          that.setData({
            records: processedRecords,
            isLoading: false
          });
        } else {
          that.setData({
            isLoading: false,
            hasError: true,
            errorMsg: res.data.message || '获取记录失败'
          });
          wx.showToast({
            title: res.data.message || '获取记录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取记录失败:', err);
        that.setData({
          isLoading: false,
          hasError: true,
          errorMsg: '网络请求失败'
        });
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  extractDishName(content) {
    if (!content) return '未知菜品';

    const match = content.match(/菜品名称[：:]\s*(.+?)(?:\n|$)/);
    if (match && match[1]) {
      return match[1].trim();
    }

    return content.length > 20 ? content.substring(0, 20) + '...' : content;
  },

  
  formatTime(timeStr) {
    if (!timeStr) return '';

    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  onRecordTap(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];

    this.setData({
      selectedRecord: record,
      showDetail: true
    });
  },


  onCloseDetail() {
    this.setData({
      showDetail: false,
      selectedRecord: null
    });
  },


  stopPropagation(e) {

  },


  onPullDownRefresh() {
    this.loadRecords();
    wx.stopPullDownRefresh();
  },


  onShareAppMessage() {
    return {
      title: '我的识别记录',
      path: '/pages/ai/kitchen/recipe_records/recipe_records'
    };
  }
});
