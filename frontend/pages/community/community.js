const app = getApp();
const Auth = require('../../utils/auth');
const { get, post } = require('../../utils/request');

Page({
  data: {
    currentTab: 'discover',
    postList: [],
    loading: false,
    page: 1,
    pageSize: 6,
    hasMore: true,
    StatusBar: 0,
    CustomBar: 0,
    isScrolling: false,
    scrollTop: 0,
    marginTop: 0,
    noMoreToastShown: false,
    
    isLogin: false,
    userId: null,
    nickname: '',
    avatar: '',
    
    userInfo: {
      nickname: '',
      avatar: ''
    }
  },

  scrollTop: 0,
  scrollTopBeforeLoad: 0,
  scrollTimer: null,
  toastTimer: null,

  onLoad() {
    this.checkLoginStatus();
    this.getPostList();

    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });
    this.setData({
      marginTop: this.data.CustomBar + 50
    });
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.postList.length === 0) {
      this.refreshPostList();
    }
  },

  checkLoginStatus() {
    const isLogin = Auth.isLogin();
    
    if (isLogin) {
      const userInfo = Auth.getUserInfo();
      this.setData({
        isLogin: true,
        userId: userInfo.userId,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        userInfo: {
          nickname: userInfo.nickname,
          avatar: userInfo.avatar
        }
      });
    } else {
      this.setData({
        isLogin: false,
        userId: null,
        nickname: '',
        avatar: '',
        userInfo: {
          nickname: '',
          avatar: ''
        }
      });
    }
  },

  async doLogin() {
    wx.showLoading({ title: '登录中...', mask: true });
    
    try {
      await Auth.login();
      this.checkLoginStatus();
      wx.showToast({ title: '登录成功', icon: 'success' });
      this.refreshPostList();
    } catch (err) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this.data.currentTab === tab) return;
  
    this.setData({
      currentTab: tab,
      page: 1,
      postList: [],
      hasMore: true,
      loading: false
    });
  
    this.getPostList();
  },

  refreshPostList() {
    this.setData({
      page: 1,
      postList: [],
      hasMore: true,
      loading: false,
      noMoreToastShown: false
    });
    this.getPostList();
  },

  getPostList() {
    const that = this;

    if (that.data.loading) return;
    that.setData({ loading: true });

    if (that.data.page === 1) {
      wx.showLoading({ title: '加载中...' });
    }

    let url;
    let requestData = {};

    if (that.data.currentTab === 'discover') {
      url = 'http://localhost:8081/post/list';
      requestData = {
        page: that.data.page,
        size: that.data.pageSize
      };
    } else if (that.data.currentTab === 'follow') {
      url = 'http://localhost:8081/post/followedPosts';

      if (!that.data.isLogin || !that.data.userId) {
        wx.hideLoading();
        that.setData({ loading: false });
        wx.showToast({ title: '请先登录查看关注', icon: 'none' });
        return;
      }

      requestData = {
        userId: that.data.userId
      };
    }

    wx.request({
      url: url,
      method: 'GET',
      data: requestData,
      success(res) {
        wx.hideLoading();
        if (res.data.code === 200) {
          const list = that.processPostData(res.data.data || []);
          const isRefresh = that.data.page === 1;

          that.setData({
            postList: isRefresh ? list : [...that.data.postList, ...list],
            loading: false,
            hasMore: that.data.currentTab === 'discover' && list.length >= that.data.pageSize
          });
        } else {
          that.setData({ loading: false });
          wx.showToast({ title: res.data.msg || '加载失败', icon: 'none' });
        }
        wx.stopPullDownRefresh();
      },
      fail() {
        wx.hideLoading();
        wx.showToast({ title: '网络异常', icon: 'none' });
        that.setData({ loading: false });
        wx.stopPullDownRefresh();
      }
    });
  },

  processPostData(data) {
    const that = this;
    return data.map(item => {
      let imageUrls = [];
      let coverImage = '';

      const rawImageUrls = item.imageUrls || item.image_Urls;

      if (rawImageUrls) {
        if (typeof rawImageUrls === 'string') {
          try {
            let parsed = rawImageUrls;
            while (typeof parsed === 'string' && parsed.startsWith('"') && parsed.endsWith('"')) {
              parsed = JSON.parse(parsed);
            }
            imageUrls = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
            
            if (!Array.isArray(imageUrls)) {
              imageUrls = [];
            }
          } catch (e) {
            if (rawImageUrls.includes(',')) {
              imageUrls = rawImageUrls.split(',').map(url => url.trim()).filter(url => url);
            } else if (rawImageUrls.startsWith('http')) {
              imageUrls = [rawImageUrls];
            } else {
              imageUrls = [];
            }
          }
        } else if (Array.isArray(rawImageUrls)) {
          imageUrls = rawImageUrls;
        }
      }

      if (imageUrls.length > 0) {
        while (imageUrls.length > 0 && Array.isArray(imageUrls[0])) {
          imageUrls = imageUrls[0];
        }
        
        if (imageUrls.length > 0 && imageUrls[0]) {
          coverImage = imageUrls[0];
          if (typeof coverImage === 'object' && coverImage.url) {
            coverImage = coverImage.url;
          }
          if (!coverImage.startsWith('http') && !coverImage.startsWith('/') && !coverImage.startsWith('cloud://')) {
            coverImage = '';
          }
        }
      }

      if (!coverImage) {
        coverImage = '/img/empty-following.png'; 
      }

      let isLiked = false;
      if (that.data.isLogin && item.likedUsers) {
        isLiked = item.likedUsers.includes(that.data.userId);
      }

      return {
        ...item,
        postId: item.postId,
        post_Id: item.postId,
        likeCount: item.likeCount,
        like_Count: item.likeCount,
        imageUrls: imageUrls,
        coverImage: coverImage,
        isLiked: isLiked
      };
    });
},

  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    const postList = this.data.postList;
    
    if (postList[index] && !postList[index].imageErrorHandled) {
      postList[index].coverImage = '/img/empty-following.png';
      postList[index].imageErrorHandled = true;
      this.setData({ postList });
    }
  },

  toggleLike(e) {
    const that = this;
    const index = e.currentTarget.dataset.index;
    const postList = this.data.postList;
    const post = postList[index];
    
    if (!post) return;
    
    if (!this.data.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再点赞',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin();
          }
        }
      });
      return;
    }
    
    const isLiked = !post.isLiked;
    const likeCount = isLiked ? (post.likeCount || 0) + 1 : (post.likeCount || 0) - 1;
    
    postList[index] = {
      ...post,
      isLiked: isLiked,
      likeCount: likeCount,
      like_Count: likeCount
    };
    
    this.setData({ postList });
    
    wx.vibrateShort({ type: 'light' });
    
    wx.request({
      url: 'http://localhost:8081/post/like/' + post.postId,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        userId: this.data.userId,
        isLiked: isLiked
      },
      fail(err) {
        console.error('点赞操作失败：', err);
        postList[index] = {
          ...post,
          isLiked: !isLiked,
          likeCount: post.likeCount,
          like_Count: post.likeCount
        };
        that.setData({ postList });
        wx.showToast({ title: '操作失败，请重试', icon: 'none' });
      }
    });
  },

  goToPublish() {
    if (!this.data.isLogin) {
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
    
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goToPostDetail(e) {
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/man/man?id=${postId}` });
  },

  goToAuthorHome(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/man/man?id=${userId}` });
  },
  
  goToHostDetail(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post/post?id=${userId}`
    });
  },

  onPageScroll(e) {
    this.scrollTop = e.scrollTop;
    
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    
    if (!this.data.isScrolling) {
      this.setData({ isScrolling: true });
    }
    
    this.scrollTimer = setTimeout(() => {
      this.setData({ isScrolling: false });
    }, 300);
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      postList: [],
      hasMore: true,
      loading: false
    });
    this.getPostList();
  
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 800);
  },

  onReachBottom() {
    if (this.data.currentTab === 'follow') return;
  
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.getPostList();
  }
});