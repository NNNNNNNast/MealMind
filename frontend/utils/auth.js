// utils/auth.js
const baseUrl = '';

class Auth {
  // 微信登录
  static async login(retryCount = 0) {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '登录中...', mask: true });
      
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            this.requestLogin(loginRes.code)
              .then(resolve)
              .catch(async (err) => {
                if (retryCount < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  this.login(retryCount + 1).then(resolve).catch(reject);
                } else {
                  reject(err);
                }
              })
              .finally(() => wx.hideLoading());
          } else {
            wx.hideLoading();
            reject(new Error('获取code失败'));
          }
        },
        fail: (err) => {
          wx.hideLoading();
          reject(new Error('微信登录失败'));
        }
      });
    });
  }

  // 请求后端登录接口
  static requestLogin(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${baseUrl}/user/login`,
        method: 'POST',
        data: { code: code },
        success: (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP错误: ${res.statusCode}`));
            return;
          }
          
          if (res.data.code === 200) {
            const data = res.data.data;
            const token = data.token;
            
            if (!token) {
              reject(new Error('后端未返回token'));
              return;
            }
            
            wx.setStorageSync('satoken', token);
            wx.setStorageSync('userId', data.userId);
            wx.setStorageSync('nickname', data.nickname || '用户');
            wx.setStorageSync('avatar', data.avatar || '/images/default-avatar.png');
            wx.setStorageSync('profileId', data.profileId);
            
            resolve({ 
              userId: data.userId, 
              nickname: data.nickname, 
              avatar: data.avatar, 
              profileId: data.profileId 
            });
          } else {
            reject(new Error(res.data.msg || '登录失败'));
          }
        },
        fail: () => reject(new Error('网络请求失败'))
      });
    });
  }

  // 获取 userId
  static getUserId() {
    return wx.getStorageSync('userId') || null;
  }

  // 获取 token
  static getToken() {
    return wx.getStorageSync('satoken') || null;
  }

  // 获取用户信息
  static getUserInfo() {
    return {
      userId: wx.getStorageSync('userId'),
      nickname: wx.getStorageSync('nickname') || '点击登录',
      avatar: wx.getStorageSync('avatar') || '/images/default-avatar.png',
      profileId: wx.getStorageSync('profileId')
    };
  }

  // 判断是否登录
  static isLogin() {
    return !!(this.getUserId() && this.getToken());
  }

  // 退出登录
  static async logout() {
    const userId = this.getUserId();
    const token = this.getToken();
    
    if (userId && token) {
      try {
        const request = require('./request');
        await request.post('/user/logout');
      } catch (err) {
        // 静默失败
      }
    }
    
    const keysToRemove = ['userId', 'nickname', 'avatar', 'profileId', 'satoken'];
    keysToRemove.forEach(key => wx.removeStorageSync(key));
  }

  // 检查登录状态
  static async checkLogin() {
    if (!this.isLogin()) return false;
    
    try {
      const request = require('./request');
      const res = await request.get('/user/info');
      const isValid = res.code === 200 && res.data;
      
      if (!isValid) {
        wx.removeStorageSync('satoken');
        wx.removeStorageSync('userId');
        wx.removeStorageSync('nickname');
        wx.removeStorageSync('avatar');
        wx.removeStorageSync('profileId');
      }
      
      return isValid;
    } catch (err) {
      return false;
    }
  }
}

module.exports = Auth;