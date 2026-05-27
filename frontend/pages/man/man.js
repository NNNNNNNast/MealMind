// 作者主页
const app = getApp();
const Auth = require('../../utils/auth');
const { get, post } = require('../../utils/request');

Page({
  data: {
    authorInfo: {
      id: '',
      nickname: '',
      avatar: '',
      profileId: ''
    },
    currentUser: {
      isLoggedIn: false,
      userId: null,
      nickname: '',
      avatar: ''
    },
    authorPosts: [],
    loading: false,
    postLoading: false,
    page: 1,
    pageSize: 4,
    hasMore: true,
    isFollowed: false,
    StatusBar: 0,
    CustomBar: 0,
    followCount: 0,
    followingCount: 0,
    likeCount: 0,
    postCount: 0
  },

onLoad: function(options) {
  console.log('接收到的参数:', options);
  
  this.setData({
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar
  });

  const authorId = options.userId || options.id;
  
  if (!authorId) {
    wx.showToast({ title: '作者不存在', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 1500);
    return;
  }
  
  this.setData({ 'authorInfo.id': authorId });
  this.checkCurrentUser();
  this.loadAuthorInfo(authorId);
  this.loadAuthorPosts(authorId, false);
},

  onShow() {
    this.checkCurrentUser();
    if (this.data.currentUser.isLoggedIn && this.data.authorInfo.id) {
      this.checkFollowStatus();
    }
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
        'currentUser.avatar': userInfo.avatar || '/images/default-avatar.png'
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
      
      if (this.data.authorInfo.id) {
        this.checkFollowStatus();
      }
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
          this.checkCurrentUser();
          wx.showToast({ title: '已退出登录', icon: 'success' });
          
          this.setData({
            isFollowed: false
          });
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    console.log('用户点击返回按钮');
    wx.navigateBack({ delta: 1 });
  },

  // 加载作者信息
  loadAuthorInfo: function(authorId) {
    const that = this;
    
    if (that.data.loading) {
      console.log('正在加载中，跳过本次请求');
      return;
    }

    that.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });
    
    const requestUrl = 'http://localhost:8081/user/' + authorId;
    console.log('请求URL:', requestUrl);
    
    wx.request({
      url: requestUrl,
      method: 'GET',
      data: { id: authorId },
      success(res) {
        console.log('作者信息响应:', res.data);

        if (res.data.code === 200) {
          const rawData = res.data.data;
          console.log('原始作者数据:', rawData);
          
          if (!rawData) {
            console.error('作者数据为空');
            wx.showToast({ title: '无数据', icon: 'none' });
            return;
          }

          const authorInfo = {
            id: rawData.userId,
            nickname: rawData.nickname,
            avatar: rawData.avatar && rawData.avatar !== '' 
              ? rawData.avatar 
              : 'https://via.placeholder.com/100x100?text=Avatar',
            profileId: rawData.profileId
          };
          
          console.log('组装后的作者信息:', authorInfo);
          
          that.setData({
            authorInfo: authorInfo,
            followCount: rawData.followCount || 0,
            followingCount: rawData.followingCount || 0,
            likeCount: rawData.likeCount || 0,
            postCount: rawData.postCount || 0
          });
          
          if (that.data.currentUser.isLoggedIn) {
            that.checkFollowStatus();
          }
        } else {
          console.error('加载失败:', res.data.msg);
          wx.showToast({ title: res.data.msg || '加载失败', icon: 'none' });
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete() {
        wx.hideLoading();
        that.setData({ loading: false });
      },
    });
  },

  // 加载作者发布的帖子
  loadAuthorPosts: function(authorId, isLoadMore = false) {
    const that = this;
    console.log('作者ID:', authorId);
    console.log('是否加载更多:', isLoadMore);
    console.log('当前页码:', that.data.page);
    
    if (that.data.postLoading) {
      console.log('正在加载中，跳过本次请求');
      return;
    }

    if (!isLoadMore) {
      console.log('首次加载，重置列表状态');
      this.setData({
        page: 1,
        authorPosts: [],
        hasMore: true,
        postLoading: false
      });
    }

    this.setData({ postLoading: true });

    if (!isLoadMore) {
      wx.showLoading({ title: '加载中...' });
    }
    
    const requestUrl = `http://localhost:8081/post/user/${authorId}`;
    const requestData = {
      page: that.data.page,
      pageSize: that.data.pageSize
    };
    
    console.log('请求URL:', requestUrl);
    console.log('请求参数:', requestData);
    
    wx.request({
      url: requestUrl,
      method: 'GET',
      data: requestData,
      success(res) {
        console.log('帖子列表响应:', res.data);
        
        if (!isLoadMore) wx.hideLoading();

        if (res.data.code === 200) {
          const posts = res.data.data;
          console.log('帖子数据条数:', posts.length);
          
          if (posts.length > 0) {
            console.log('第一条帖子示例:', posts[0]);
          }
          
          const formattedPosts = posts.map((item, index) => {
            const coverImage = that.getFirstImage(item.imageUrls);
            
            return {
              postId: item.postId,
              userId: item.userId,
              imageUrls: item.imageUrls,
              title: item.title,
              likeCount: item.likeCount,
              createdAt: item.createdAt,
              nickname: item.nickname,
              avatar: item.avatar && item.avatar !== '' 
                ? item.avatar 
                : 'https://via.placeholder.com/100x100?text=Avatar',
              coverImage: coverImage
            };
          });
          
          console.log('格式化后的帖子列表:', formattedPosts);

          const newList = isLoadMore
            ? that.data.authorPosts.concat(formattedPosts)
            : formattedPosts;

          const hasMore = posts.length >= that.data.pageSize;

          that.setData({
            authorPosts: newList,
            hasMore: hasMore,
            page: that.data.page + 1,
            postLoading: false,
            postCount: newList.length
          });
          
          console.log('当前帖子总数:', that.data.authorPosts.length);
          console.log('是否还有更多:', hasMore);
          
        } else {
          console.error('加载失败:', res.data.msg);
          wx.showToast({ title: res.data.msg || '加载失败', icon: 'none' });
          that.setData({ postLoading: false });
        }
      },
      fail(err) {
        if (!isLoadMore) wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
        that.setData({ postLoading: false });
      },
      complete() {
        that.setData({ postLoading: false });
      },
    });
  },

  // 获取第一张图片
  getFirstImage(imageUrlsStr) {
    if (!imageUrlsStr) {
      return '';
    }
    
    try {
      let urls;
      if (Array.isArray(imageUrlsStr)) {
        urls = imageUrlsStr;
      } 
      else if (typeof imageUrlsStr === 'string') {
        let parsed = imageUrlsStr;
        while (typeof parsed === 'string' && parsed.startsWith('"') && parsed.endsWith('"')) {
          parsed = JSON.parse(parsed);
        }
        urls = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      }
      else {
        urls = [];
      }
      
      const firstImage = Array.isArray(urls) && urls.length > 0 ? urls[0] : '';
      return firstImage;
    } catch (e) {
      console.warn('解析图片JSON失败:', e);
      if (typeof imageUrlsStr === 'string' && imageUrlsStr.startsWith('http')) {
        return imageUrlsStr;
      }
      return '';
    }
  },
  
  // 上拉加载更多
  onReachBottom() {
    console.log('hasMore:', this.data.hasMore);
    console.log('postLoading:', this.data.postLoading);
    
    if (!this.data.hasMore) {
      wx.showToast({ title: '已经到底了', icon: 'none', duration: 1500 });
      return;
    }
    
    if (!this.data.postLoading && this.data.authorInfo.id) {
      console.log('开始加载更多...');
      this.loadAuthorPosts(this.data.authorInfo.id, true);
    } else {
      console.log('正在加载中...');
    }
  },

  // 检查是否关注了作者
  checkFollowStatus() {
    const that = this;
    
    if (!this.data.currentUser.isLoggedIn || !this.data.currentUser.userId) {
      console.log('用户未登录，跳过检查关注状态');
      return;
    }
    
    const currentUserId = this.data.currentUser.userId;
    const authorId = this.data.authorInfo.id;
    
    console.log('当前用户ID:', currentUserId);
    console.log('作者ID:', authorId);
    
    if (!authorId) {
      console.log('作者ID为空，跳过');
      return;
    }

    const token = Auth.getToken();

    wx.request({
      url: 'http://localhost:8081/follow/check',
      method: 'POST',
      header: {
        'Cookie': `satoken=${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: currentUserId,
        authorId: authorId,
        user_id: currentUserId,
        author_id: authorId,
        followerId: currentUserId,
        followingId: authorId
      },
      success(res) {
        console.log('关注状态响应:', res.data);
        if (res.data.code === 200) {
          that.setData({
            isFollowed: res.data.isFollowed || res.data.is_followed || false
          });
          console.log('关注状态:', that.data.isFollowed ? '已关注' : '未关注');
        } else {
          console.error('检查关注状态失败:', res.data.msg);
          that.checkFollowStatusAlternative(currentUserId, authorId);
        }
      },
      fail(err) {
        console.error('检查关注状态失败:', err);
      }
    });
  },

  // 备用的关注状态检查方法
  checkFollowStatusAlternative(currentUserId, authorId) {
    const that = this;
    const token = Auth.getToken();
    
    wx.request({
      url: `http://localhost:8081/follow/check?userId=${currentUserId}&authorId=${authorId}`,
      method: 'GET',
      header: {
        'Cookie': `satoken=${token}`
      },
      success(res) {
        console.log('备用方法 - 关注状态响应:', res.data);
        if (res.data.code === 200) {
          that.setData({
            isFollowed: res.data.isFollowed || res.data.is_followed || false
          });
          console.log('关注状态:', that.data.isFollowed ? '已关注' : '未关注');
        }
      },
      fail(err) {
        console.error('备用方法 - 检查关注状态失败:', err);
      }
    });
  },

  // 关注/取消关注作者
  toggleFollow() {
    const that = this;
    
    
    if (!this.data.currentUser.isLoggedIn) {
      console.log('用户未登录，提示登录');
      wx.showModal({
        title: '提示',
        content: '请先登录后再关注作者',
        confirmText: '去登录',
        success(res) {
          if (res.confirm) {
            that.doLogin();
          }
        }
      });
      return;
    }
    
    const currentUserId = this.data.currentUser.userId;
    const authorId = this.data.authorInfo.id;
    const isCurrentlyFollowing = this.data.isFollowed;
    
    if (currentUserId === authorId) {
      wx.showToast({
        title: '不能关注自己',
        icon: 'none'
      });
      return;
    }
    
    console.log('操作类型:', isCurrentlyFollowing ? '取消关注' : '关注');
    console.log('当前用户ID:', currentUserId);
    console.log('作者ID:', authorId);

    this.setData({
      isFollowed: !isCurrentlyFollowing,
      followCount: isCurrentlyFollowing 
        ? this.data.followCount - 1 
        : this.data.followCount + 1
    });

    const token = Auth.getToken();
    const url = isCurrentlyFollowing
      ? 'http://localhost:8081/follow/unfollow'
      : 'http://localhost:8081/follow/follow';

    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Cookie': `satoken=${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        userId: currentUserId,
        authorId: authorId,
        user_id: currentUserId,
        author_id: authorId,
        followerId: currentUserId,
        followingId: authorId
      },
      success(res) {
        console.log('关注操作响应:', res.data);
        if (res.data.code === 200) {
          wx.showToast({
            title: isCurrentlyFollowing ? '取消关注成功' : '关注成功',
            icon: 'success'
          });
        } else {
          that.setData({
            isFollowed: isCurrentlyFollowing,
            followCount: isCurrentlyFollowing 
              ? that.data.followCount + 1 
              : that.data.followCount - 1
          });
          wx.showToast({
            title: res.data.msg || '操作失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        that.setData({
          isFollowed: isCurrentlyFollowing,
          followCount: isCurrentlyFollowing 
            ? that.data.followCount + 1 
            : that.data.followCount - 1
        });
        wx.showToast({
          title: '网络异常',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到帖子详情页
  goToPostDetail: function(e) {
    const postId = e.currentTarget.dataset.id;
    console.log('跳转到帖子详情，ID:', postId);
    wx.navigateTo({
      url: '/pages/post/post?id=' + postId
    });
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新');
    const authorId = this.data.authorInfo.id;
    if (authorId) {
      this.setData({
        page: 1,
        authorPosts: [],
        hasMore: true
      });
      this.loadAuthorInfo(authorId);
      this.loadAuthorPosts(authorId, false);
      setTimeout(() => {
        wx.stopPullDownRefresh();
      }, 1000);
    } else {
      wx.stopPullDownRefresh();
    }
  },
  
  onHide() {
    console.log('作者主页隐藏');
  },
  
  onUnload() {
    console.log('作者主页卸载');
  }
});