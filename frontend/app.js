// app.js
const { markdownToHtml } = require('./utils/markdown.js');
const Auth = require('./utils/auth');

App({
  globalData: {
    StatusBar: 20,
    CustomBar: 64,
    screenWidth: 375,
    searchWidth: 0,
    menuButtonInfo: {
      width: 87,
      height: 32,
      top: 48,
      right: 350,
      bottom: 80,
      left: 263
    },
    markdownToHtml: markdownToHtml,
    addData: null,
    loginPromise: null,
    userId: null
  },

  onLaunch: function () {
    this.getSystemInfo();
    this.globalData.loginPromise = this.autoLogin();

    if (wx.cloud) {
      wx.cloud.init({
        env: '',
        traceUser: true,
      });
    }
  },

  async autoLogin() {
    try {
      if (Auth.isLogin()) {
        const isValid = await Auth.checkLogin();
        if (isValid) {
          const userInfo = Auth.getUserInfo();
          this.globalData.userId = userInfo.userId;
          this.globalData.avatar = userInfo.avatar;
          return true;
        }
      }
      
      const result = await Auth.login();
      this.globalData.userId = result.userId;
      return true;
    } catch (err) {
      return false;
    }
  },

  // 等待登录完成
  async waitForLogin() {
    if (this.globalData.userId) {
      return true;
    }
    
    if (this.globalData.loginPromise) {
      const result = await this.globalData.loginPromise;
      return result;
    }
    
    this.globalData.loginPromise = this.autoLogin();
    const result = await this.globalData.loginPromise;
    return result;
  },

  getSystemInfo: function () {
    try {
      let statusBarHeight = 20;
      let screenWidth = 375;

      if (wx.getWindowInfo) {
        const windowInfo = wx.getWindowInfo();
        statusBarHeight = windowInfo.statusBarHeight || 20;
        screenWidth = windowInfo.screenWidth || 375;
        this.globalData.screenWidth = screenWidth;
      }

      let customBarHeight = statusBarHeight + 44;
      let menuButton = null;
      
      try {
        menuButton = wx.getMenuButtonBoundingClientRect();
        if (menuButton) {
          customBarHeight = menuButton.bottom + menuButton.top - statusBarHeight;
          
          this.globalData.menuButtonInfo = {
            width: menuButton.width,
            height: menuButton.height,
            top: menuButton.top,
            right: menuButton.right,
            bottom: menuButton.bottom,
            left: menuButton.left
          };
        }
      } catch (e) {
        // 获取失败使用默认值
      }

      const rightMargin = 8;
      let searchWidth = 0;
      
      if (menuButton && menuButton.left) {
        searchWidth = menuButton.left - 3 * rightMargin;
      } else {
        searchWidth = screenWidth - 100;
      }
      
      const finalSearchWidth = searchWidth > 100 ? searchWidth : screenWidth - 100;

      this.globalData.StatusBar = statusBarHeight;
      this.globalData.CustomBar = customBarHeight;
      this.globalData.searchWidth = finalSearchWidth;

    } catch (e) {
      // 使用默认值
      this.globalData.StatusBar = 20;
      this.globalData.CustomBar = 64;
      this.globalData.screenWidth = 375;
      this.globalData.searchWidth = 280;
      this.globalData.menuButtonInfo = {
        width: 87,
        height: 32,
        top: 48,
        right: 350,
        bottom: 80,
        left: 263
      };
    }
  }
});