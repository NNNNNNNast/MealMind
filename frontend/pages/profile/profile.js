const app = getApp();
const Auth = require('../../utils/auth');
const request = require('../../utils/request');

Page({
  data: {
    // 用户信息
    userId: null,                   
    avatar: 'https://img1.baidu.com/it/u=105216936,2956740654&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
    nickname: '点击登录',          
    isLogin: false,                  

    // 导航栏
    StatusBar: 0,
    CustomBar: 0,

    // Tab 相关
    activeTab: 'posts',
    userPosts: [],
    followingUsers: [],
    postsLoading: false,
    followingLoading: false,
    hasMorePosts: true,
    hasMoreFollowing: true,
    postsPage: 1,
    followingPage: 1,
    postsPageSize: 10,
    followingPageSize: 10,
    
    // 统计数据
    postCount: 0,
    totalLikes: 0,
    followingCount: 0,
  },

  async onLoad() {
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });
    await this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
    if (this.data.isLogin) {
      this.loadUserPosts(true);
      this.loadFollowingUsers(true);
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    const isLogin = Auth.isLogin();
    
    if (isLogin) {
      const userInfo = Auth.getUserInfo();
      console.log("yes", userInfo);
      this.setData({
        userId: userInfo.userId,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar || '/images/default-avatar.png',
        isLogin: true
      });
    } else {
      this.setData({
        userId: null,
        nickname: '点击登录',
        avatar: '/images/default-avatar.png',
        isLogin: false,
        postCount: 0,
        totalLikes: 0,
        followingCount: 0,
        userPosts: [],
        followingUsers: []
      });
    }
  },

  // 点击登录/退出
  async handleLogin() {
    if (this.data.isLogin) {
      await this.logout();
    } else {
      await this.doLogin();
    }
  },

  // 执行登录
  async doLogin() {
    wx.showLoading({ title: '登录中...' });
    
    try {
      await Auth.login();
      await this.loadUserInfo();
      this.loadUserPosts(true);
      this.loadFollowingUsers(true);
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 退出登录
  async logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          await Auth.logout();
          await this.loadUserInfo();
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  },

  // 页面跳转
  goToEdit() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/edit/edit' });
  },

  goToMyPosts() {
    if (!this.data.isLogin) return;
    this.setData({ activeTab: 'posts' });
  },

  goToLikes() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/likes/likes' });
  },

  goToFollowing() {
    if (!this.data.isLogin) return;
    this.setData({ activeTab: 'following' });
    if (this.data.followingUsers.length === 0) {
      this.loadFollowingUsers(true);
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    if (tab === 'posts' && this.data.userPosts.length === 0) {
      this.loadUserPosts(true);
    } else if (tab === 'following' && this.data.followingUsers.length === 0) {
      this.loadFollowingUsers(true);
    }
  },

  // 加载用户帖子
  loadUserPosts(refresh = false) {
    if (!this.data.isLogin || !this.data.userId) return;
    
    if (refresh) {
      this.setData({ postsPage: 1, userPosts: [], hasMorePosts: true });
    }
    
    if (!this.data.hasMorePosts || this.data.postsLoading) return;
    
    this.setData({ postsLoading: true });
    
    request.get(`/post/user/${this.data.userId}`, {
      page: this.data.postsPage,
      pageSize: this.data.postsPageSize
    }).then(res => {
      this.setData({ postsLoading: false });
      
      if (res && res.code === 200) {
        const newList = res.data || [];
        
        const processedList = newList.map(post => {
          let imageUrlsArray = [];
          
          if (post.imageUrls) {
            try {
              let raw = post.imageUrls;
              if (typeof raw !== 'string') raw = JSON.stringify(raw);
              raw = raw.trim();
              while (raw.startsWith('"') && raw.endsWith('"')) {
                raw = raw.slice(1, -1);
              }
              if (raw.startsWith('[')) {
                imageUrlsArray = JSON.parse(raw);
              } else if (raw.includes(',')) {
                imageUrlsArray = raw.split(',');
              } else if (raw.startsWith('http')) {
                imageUrlsArray = [raw];
              }
              if (!Array.isArray(imageUrlsArray)) imageUrlsArray = [];
              imageUrlsArray = imageUrlsArray.filter(url => {
                if (typeof url === 'string') {
                  url = url.replace(/^["']|["']$/g, '');
                  return url.startsWith('http') || url.startsWith('/') || url.startsWith('cloud://');
                }
                return false;
              });
            } catch (e) {
              imageUrlsArray = [];
            }
          }
          
          return { ...post, imageUrlsArray };
        });
        
        const newUserPosts = refresh ? processedList : [...this.data.userPosts, ...processedList];
        
        this.setData({
          userPosts: newUserPosts,
          hasMorePosts: processedList.length === this.data.postsPageSize,
          postsPage: refresh ? 2 : this.data.postsPage + 1
        });
        
        if (refresh) {
          let totalLikes = 0;
          newUserPosts.forEach(post => {
            totalLikes += post.likeCount || 0;
          });
          this.setData({ 
            postCount: newUserPosts.length,
            totalLikes: totalLikes
          });
        }
      } else {
        this.setData({ hasMorePosts: false });
      }
    }).catch(err => {
      this.setData({ postsLoading: false });
    });
  },

  // 加载关注列表
  loadFollowingUsers(refresh = false) {
    if (!this.data.isLogin || !this.data.userId) return;
    
    if (refresh) {
      this.setData({ followingPage: 1, followingUsers: [], hasMoreFollowing: true });
    }
    
    if (!this.data.hasMoreFollowing || this.data.followingLoading) return;
    
    this.setData({ followingLoading: true });
    
    request.get('/user/following/list', {
      userId: this.data.userId,
      page: this.data.followingPage,
      pageSize: this.data.followingPageSize
    }).then(res => {
      this.setData({ followingLoading: false });
      
      if (res && res.code === 200) {
        const newList = res.data || [];
        const newFollowingUsers = refresh ? newList : [...this.data.followingUsers, ...newList];
        
        this.setData({
          followingUsers: newFollowingUsers,
          hasMoreFollowing: newList.length === this.data.followingPageSize,
          followingPage: refresh ? 2 : this.data.followingPage + 1
        });
        
        if (refresh) {
          this.setData({ followingCount: newList.length });
        }
      } else {
        this.setData({ hasMoreFollowing: false });
      }
    }).catch(err => {
      this.setData({ followingLoading: false });
    });
  },

  // 跳转帖子详情
  goToPostDetail(e) {
    const postId = e.currentTarget.dataset.postid;
    wx.navigateTo({ url: `/pages/post/post?id=${postId}` });
  },

  // 跳转用户主页
  goToUserProfile(e) {
    const userId = e.currentTarget.dataset.userid;
    wx.navigateTo({ url: `/pages/man/man?userId=${userId}` });
  },

  // 加载更多
  loadMorePosts() {
    if (this.data.hasMorePosts && !this.data.postsLoading) {
      this.loadUserPosts(false);
    }
  },

  loadMoreFollowing() {
    if (this.data.hasMoreFollowing && !this.data.followingLoading) {
      this.loadFollowingUsers(false);
    }
  },

  // 图片加载失败处理
  onImageError(e) {
    console.error('图片加载失败:', e.currentTarget.dataset.src);
  },

  // 跳转浏览记录
  goToHistory() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/history/history' });
  },

  // 跳转收藏
  goToFavorite() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/favorite/favorite' });
  },

  // 跳转反馈
  goToFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  // 跳转关于
  goToAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  }
});