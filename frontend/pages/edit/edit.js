const app = getApp();
const Auth = require('../../utils/auth');
const { get, post } = require('../../utils/request');

Page({
  data: {
    displayAvatar: '',    
    originalAvatar: '',    
    nickname: '',
    saving: false,
    StatusBar: 0,
    CustomBar: 0,
    tempAvatarPath: ''    
  },

  onLoad() {
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await get('/user/info');
      if (res.data.code === 200) {
        const user = res.data.data;
        const avatar = user.avatar || '/images/default-avatar.png';
        this.setData({
          nickname: user.nickname || '',
          displayAvatar: avatar,
          originalAvatar: avatar
        });
      } else {
        const userInfo = Auth.getUserInfo();
        const avatar = userInfo.avatar || '/images/default-avatar.png';
        this.setData({
          nickname: userInfo.nickname === '点击登录' ? '' : userInfo.nickname,
          displayAvatar: avatar,
          originalAvatar: avatar
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      const userInfo = Auth.getUserInfo();
      const avatar = userInfo.avatar || '/images/default-avatar.png';
      this.setData({
        nickname: userInfo.nickname === '点击登录' ? '' : userInfo.nickname,
        displayAvatar: avatar,
        originalAvatar: avatar
      });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          displayAvatar: tempFilePath,    
          tempAvatarPath: tempFilePath    
        });
        
        wx.showToast({
          title: '已选择新头像',
          icon: 'success',
          duration: 1500
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 上传头像到云存储
  async uploadAvatarToCloud(tempFilePath) {
    if (!wx.cloud) {
      throw new Error('请先开通微信云开发');
    }
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    const cloudPath = `avatars/${timestamp}_${random}.jpg`;
    
    const uploadRes = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath
    });
    
    return uploadRes.fileID;
  },

  // 保存资料
  async saveProfile() {
    const { nickname, displayAvatar, tempAvatarPath, originalAvatar } = this.data;
    
    // 验证昵称
    if (!nickname || !nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    // 检查是否登录
    if (!Auth.isLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        Auth.login().then(() => {
          this.saveProfile();
        });
      }, 1500);
      return;
    }
    
    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...', mask: true });
    
    try {
      let finalAvatarUrl = displayAvatar;
      
      if (tempAvatarPath && tempAvatarPath.startsWith('http://tmp/')) {
        try {
          finalAvatarUrl = await this.uploadAvatarToCloud(tempAvatarPath);
        } catch (uploadError) {
          console.error('上传头像失败:', uploadError);
          wx.showToast({
            title: '头像上传失败',
            icon: 'none'
          });
          this.setData({
            displayAvatar: originalAvatar,
            saving: false
          });
          wx.hideLoading();
          return;
        }
      }
      
      const res = await post('/user/update', {
        nickname: nickname.trim(),
        avatar: finalAvatarUrl
      });
      
      wx.hideLoading();
      
      if (res.data.code === 200) {
        wx.setStorageSync('nickname', nickname.trim());
        wx.setStorageSync('avatar', finalAvatarUrl);
        
        if (app.globalData.userInfo) {
          app.globalData.userInfo.nickname = nickname.trim();
          app.globalData.userInfo.avatar = finalAvatarUrl;
        }
        
        this.setData({
          displayAvatar: finalAvatarUrl,
          originalAvatar: finalAvatarUrl,
          tempAvatarPath: '',
          saving: false
        });
        
        wx.showToast({
          title: res.data.msg || '保存成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.data.msg || '保存失败',
          icon: 'none'
        });
        this.setData({
          displayAvatar: originalAvatar,
          saving: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('保存资料失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
      this.setData({
        displayAvatar: originalAvatar,
        saving: false
      });
    }
  }
});