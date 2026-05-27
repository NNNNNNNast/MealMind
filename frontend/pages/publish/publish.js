const app = getApp();
const Auth = require('../../utils/auth');
const request = require('../../utils/request');

Page({
  data: {
    // 帖子标题
    title: '',
    // 帖子内容
    content: '',
    // 图片列表
    imgList: [],
    // 当前选中分类索引
    categoryIndex: 0,
    // 发布加载状态
    publishing: false,
    // 当前用户信息
    currentUser: {
      isLoggedIn: false,
      userId: null,
      nickname: '',
      avatar: ''
    },
    StatusBar: 0,
    CustomBar: 0,
  },

  onLoad() {
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });
    
    this.checkCurrentUser();
  },

  onShow() {
    this.checkCurrentUser();
  },

  // 检查当前登录用户
  checkCurrentUser() {
    const isLoggedIn = Auth.isLogin();
    
    if (isLoggedIn) {
      const userInfo = Auth.getUserInfo();
      this.setData({
        'currentUser.isLoggedIn': true,
        'currentUser.userId': userInfo.userId,
        'currentUser.nickname': userInfo.nickname,
        'currentUser.avatar': userInfo.avatar
      });
      console.log('当前登录用户:', userInfo.nickname, '(ID:', userInfo.userId, ')');
    } else {
      this.setData({
        'currentUser.isLoggedIn': false,
        'currentUser.userId': null,
        'currentUser.nickname': '',
        'currentUser.avatar': ''
      });
      console.log('当前未登录');
    }
  },

  // 执行登录
  async doLogin() {
    wx.showLoading({ title: '登录中...', mask: true });
    
    try {
      await Auth.login();
      this.checkCurrentUser();
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },
  
  // 输入标题
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    });
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  chooseImage() {
    if (!this.data.currentUser.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布帖子',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin();
          }
        }
      });
      return;
    }
    
    wx.chooseMedia({
      count: 9 - this.data.imgList.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImgList = this.data.imgList.concat(res.tempFiles.map(item => item.tempFilePath));
        this.setData({
          imgList: newImgList
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
        console.error('选择图片失败：', err);
      }
    });
  },

  // 删除图片
  deleteImg(e) {
    const index = e.currentTarget.dataset.index;
    const imgList = this.data.imgList;
    imgList.splice(index, 1);
    this.setData({
      imgList: imgList
    });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.imgList[index],
      urls: this.data.imgList
    });
  },

  // 提交发布
  async submitPost() {
    if (!this.data.currentUser.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布帖子',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin();
          }
        }
      });
      return;
    }
    
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入帖子标题', icon: 'none' });
      return;
    }
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入帖子内容', icon: 'none' });
      return;
    }

    const userId = this.data.currentUser.userId;

    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ publishing: true });

    try {
      let imageUrls = [];
      if (this.data.imgList.length > 0) {
        wx.showLoading({ title: '上传图片中...', mask: true });
        imageUrls = await this.uploadImages(this.data.imgList);
        wx.hideLoading();
        console.log('上传的图片URLs:', imageUrls);
      }

      const postData = {
        userId: userId,
        title: this.data.title.trim(),
        content: this.data.content.trim(),
        imageUrls: imageUrls  
    };

      console.log('提交的帖子数据:', postData);

      wx.showLoading({ title: '发布中...', mask: true });
      const res = await this.publishPost(postData);
      wx.hideLoading();

      console.log('发布响应:', res);

      if (res.data.code === 200) {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1500);
      } else {
        wx.showToast({ title: res.data.msg || '发布失败', icon: 'none' });
      }
    } catch (err) {
      console.error('发布失败：', err);
      wx.showToast({ title: err.message || '发布失败', icon: 'none' });
    } finally {
      this.setData({ publishing: false });
    }
  },

  // 上传图片
  uploadImages(filePaths) {
    const token = Auth.getToken();
    const uploadTasks = filePaths.map((filePath, index) => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: 'http://localhost:8081/post/uploadImage',
          filePath: filePath,
          name: 'file',
          header: {
            'Cookie': `satoken=${token}`
          },
          success(res) {
            console.log(`图片${index + 1}上传响应:`, res.data);
            try {
              const data = JSON.parse(res.data);
              if (data.code === 200 && data.data) {
                const imageUrl = data.data.url || data.data;
                resolve(imageUrl);
              } else {
                reject(new Error(data.msg || '图片上传失败'));
              }
            } catch (e) {
              console.error('解析响应失败:', e);
              reject(new Error('解析响应失败'));
            }
          },
          fail(err) {
            console.error(`图片${index + 1}上传失败:`, err);
            reject(err);
          }
        });
      });
    });
    return Promise.all(uploadTasks);
  },

  // 发布帖子
  publishPost(postData) {
    const token = Auth.getToken();
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:8081/post/publish',
        method: 'POST',
        data: postData,
        header: {
          'Content-Type': 'application/json',
          'Cookie': `satoken=${token}`
        },
        success(res) {
          resolve(res);
        },
        fail(err) {
          reject(err);
        }
      });
    });
  }
});