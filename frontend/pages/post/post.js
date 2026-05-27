const app = getApp();
const Auth = require('../../utils/auth');
const {
  get,
  post
} = require('../../utils/request');

Page({
  data: {
    swiperList: [],
    currentIndex: 0,
    postInfo: {
      id: '',
      title: '',
      content: '',
      image: '',
      author: '',
      authorId: '',
      authorAvatar: '',
      time: '',
      likeCount: 0,
    },
    commentList: [],
    loading: false,
    commentPage: 1,
    commentPageSize: 5,
    commentHasMore: true,
    commentLoadingMore: false,
    isLiked: false,
    StatusBar: 0,
    CustomBar: 0,
    
    // 用户身份信息
    currentUser: {
      isLoggedIn: false,
      userId: null,
      nickname: '',
      avatar: ''
    },
    postAuthor: {
      userId: null,
      nickname: '',
      avatar: '',
      isFollowed: false
    },
    
    // 评论输入框
    commentContent: '',
    showCommentInput: false,
    
    debug: true,
    showDebug: false,
  },

  onLoad: function (options) {
    console.log('接收到的参数:', options);

    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });

    this.checkCurrentUser();

    const postId = options.id;
    if (postId) {
      this.setData({
        'postInfo.id': postId
      });
      this.loadPostDetail(postId);
      this.loadComments(postId, false);
    } else {
      wx.showToast({
        title: '帖子不存在',
        icon: 'none'
      });
    }
  },

  onShow() {
    console.log('页面显示，当前帖子ID:', this.data.postInfo.id);
    this.checkCurrentUser();
    if (this.data.currentUser.isLoggedIn && this.data.postAuthor.userId) {
      this.checkFollowStatus(this.data.postAuthor.userId);
    }
  },
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
      
      if (this.data.postAuthor.userId) {
        this.checkFollowStatus(this.data.postAuthor.userId);
      }
      if (this.data.postInfo.id) {
        this.loadPostDetail(this.data.postInfo.id);
      }
    } catch (err) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 轮播切换
  swiperChange(e) {
    this.setData({ currentIndex: e.detail.current });
  },

  loadPostDetail: function (postId) {
    const that = this;
    if (that.data.loading) return;

    that.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    wx.request({
      url: 'http://localhost:8081/post/' + postId,
      method: 'GET',
      success(res) {
        console.log('帖子详情响应:', res.data);

        if (res.data.code === 200 && res.data.data && res.data.data.length > 0) {
          const rawData = res.data.data[0];
          
          const swiperList = that.processPostImages(rawData.imageUrls);

          const postInfo = {
            id: rawData.postId,
            title: rawData.title || '',
            content: rawData.content || '',
            image: rawData.imageUrls,
            author: rawData.nickname || '匿名用户',
            authorId: rawData.userId,
            authorAvatar: rawData.avatar || '/img/empty-following.png',
            time: that.formatTime(rawData.createdAt) || '未知时间',
            likeCount: rawData.likeCount || 0,
          };

          that.setData({
            postInfo: postInfo,
            swiperList: swiperList,
            'postAuthor.userId': postInfo.authorId,
            'postAuthor.nickname': postInfo.author,
            'postAuthor.avatar': postInfo.authorAvatar
          });

          if (that.data.currentUser.isLoggedIn && postInfo.authorId) {
            that.checkFollowStatus(postInfo.authorId);
          }
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete() {
        wx.hideLoading();
        that.setData({ loading: false });
      }
    });
  },

  processPostImages(image) {
    let imageUrls = [];

    if (typeof image === 'string') {
      try {
        let parsed = image;
        while (typeof parsed === 'string' && parsed.startsWith('"') && parsed.endsWith('"')) {
          parsed = JSON.parse(parsed);
        }
        imageUrls = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      } catch (e) {
        if (image.startsWith('http')) {
          imageUrls = [image];
        }
      }
    } else if (Array.isArray(image)) {
      imageUrls = image;
    }

    if (imageUrls.length === 0) {
      imageUrls = ['/img/empty-following.png'];
    }

    return imageUrls.map((url, index) => ({ id: index, url: url }));
  },

checkFollowStatus: function (authorId) {
  const that = this;
  
  if (!that.data.currentUser.isLoggedIn || !that.data.currentUser.userId) {
    console.log('用户未登录，跳过检查关注状态');
    return;
  }

  const token = Auth.getToken();
  console.log('当前用户ID:', that.data.currentUser.userId);
  console.log('作者ID:', authorId);

  wx.request({
    url: 'http://localhost:8081/follow/check',
    method: 'POST',
    header: {
      'Cookie': `satoken=${token}`,
      'Content-Type': 'application/json'
    },
    data: {
      userId: that.data.currentUser.userId,
      authorId: authorId,
      user_id: that.data.currentUser.userId,
      author_id: authorId,
      followerId: that.data.currentUser.userId,
      followingId: authorId,
      currentUserId: that.data.currentUser.userId,
      targetUserId: authorId
    },
    success(res) {
      console.log('关注状态响应:', res.data);
      if (res.data.code === 200) {
        that.setData({
          'postAuthor.isFollowed': res.data.isFollowed || res.data.is_followed || false
        });
        console.log('关注状态:', that.data.postAuthor.isFollowed ? '已关注' : '未关注');
      } else {
        console.error('检查关注状态失败:', res.data.msg);
        that.setData({
          'postAuthor.isFollowed': false
        });
      }
    },
    fail(err) {
      console.error('检查关注状态请求失败:', err);
      that.setData({
        'postAuthor.isFollowed': false
      });
    }
  });
},

 // 关注/取消关注作者 - 发送完整参数
toggleFollowAuthor() {
  const that = this;
  
  if (!this.data.currentUser.isLoggedIn) {
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

  if (this.data.currentUser.userId === this.data.postAuthor.userId) {
    wx.showToast({ title: '不能关注自己', icon: 'none' });
    return;
  }

  const isFollowed = this.data.postAuthor.isFollowed;
  const token = Auth.getToken();
  const url = isFollowed ? 
    'http://localhost:8081/follow/unfollow' : 
    'http://localhost:8081/follow/follow';

  wx.showLoading({ title: isFollowed ? '取消关注中...' : '关注中...' });

  // 发送所有可能的参数格式
  wx.request({
    url: url,
    method: 'POST',
    header: {
      'Cookie': `satoken=${token}`,
      'Content-Type': 'application/json'
    },
    data: {
      userId: that.data.currentUser.userId,
      authorId: that.data.postAuthor.userId,
      user_id: that.data.currentUser.userId,
      author_id: that.data.postAuthor.userId,
      followerId: that.data.currentUser.userId,
      followingId: that.data.postAuthor.userId,
      currentUserId: that.data.currentUser.userId,
      targetUserId: that.data.postAuthor.userId
    },
    success(res) {
      wx.hideLoading();
      console.log('关注操作响应:', res.data);
      
      if (res.data.code === 200) {
        that.setData({ 
          'postAuthor.isFollowed': !isFollowed 
        });
        wx.showToast({
          title: !isFollowed ? '关注成功' : '已取消关注',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: res.data.msg || '操作失败',
          icon: 'none'
        });
      }
    },
    fail(err) {
      wx.hideLoading();
      console.error('关注操作失败:', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  });
},

  // 作者头像加载失败
onAuthorAvatarError() {
  this.setData({
    'postAuthor.avatar': '/img/empty-following.png'
  });
},

// 评论头像加载失败
onCommentAvatarError(e) {
  const index = e.currentTarget.dataset.index;
  const commentList = this.data.commentList;
  if (commentList[index] && !commentList[index].avatarError) {
    commentList[index].avatar = '/img/empty-following.png';
    commentList[index].avatarError = true;
    this.setData({ commentList });
  }
},
  
  // 加载评论列表
  loadComments: function (postId, isLoadMore = false) {
    const that = this;

    console.log('帖子ID:', postId);
    console.log('是否加载更多:', isLoadMore);

    if (that.data.commentLoadingMore) return;
    if (isLoadMore && !that.data.commentHasMore) return;

    if (!isLoadMore) {
      this.setData({
        commentPage: 1,
        commentList: [],
        commentHasMore: true,
        commentLoadingMore: false
      });
    }

    this.setData({ commentLoadingMore: true });

    if (!isLoadMore) {
      wx.showLoading({ title: '加载评论中...' });
    }

    wx.request({
      url: `http://localhost:8081/comment/comments/${postId}`,
      method: 'GET',
      data: {
        page: that.data.commentPage,
        pageSize: that.data.commentPageSize
      },
      success(res) {
        if (!isLoadMore) wx.hideLoading();

        console.log('评论响应:', res.data);

        if (res.data.code === 200) {
          let commentsData = Array.isArray(res.data.data) ? res.data.data : [];
          console.log('评论数量:', commentsData.length);

          const comments = commentsData.map((item) => {
            const isCommentAuthor = that.data.currentUser.isLoggedIn && 
                                   item.commentUserId === that.data.currentUser.userId;
            const isPostAuthor = item.commentUserId === that.data.postAuthor.userId;
            
            return {
              id: item.commentId,
              userId: item.commentUserId,
              author: item.commentUserName || '用户',
              avatar: item.commentUserAvatar || '/images/default-avatar.png',
              content: item.commentContent,
              time: that.formatTime(item.commentTime) || '未知时间',
              likeCount: item.commentLike || 0,
              liked: false,
              isCommentAuthor: isCommentAuthor,
              isPostAuthor: isPostAuthor
            };
          });

          const newList = isLoadMore ?
            that.data.commentList.concat(comments) :
            comments;

          const hasMore = commentsData.length >= that.data.commentPageSize;

          that.setData({
            commentList: newList,
            commentHasMore: hasMore,
            commentPage: that.data.commentPage + 1,
            commentLoadingMore: false
          });

          if (commentsData.length === 0 && isLoadMore) {
            wx.showToast({ title: '已经到底了', icon: 'none', duration: 1500 });
          }
        } else {
          that.setData({ commentLoadingMore: false });
          wx.showToast({ title: res.data.msg || '加载失败', icon: 'none' });
        }
      },
      fail(err) {
        if (!isLoadMore) wx.hideLoading();
        console.error('评论请求失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
        that.setData({ commentLoadingMore: false });
      }
    });
  },

  // 上拉加载更多评论
  onReachBottom() {
    if (this.data.commentHasMore && !this.data.commentLoadingMore) {
      const postId = this.data.postInfo.id;
      if (postId) {
        this.loadComments(postId, true);
      }
    }
  },

  // 评论输入框变化
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  // 显示评论输入框
  showCommentInput() {
    if (!this.data.currentUser.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再评论',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin();
          }
        }
      });
      return;
    }

    this.setData({ showCommentInput: true });
  },

  // 隐藏评论输入框
  hideCommentInput() {
    this.setData({
      showCommentInput: false,
      commentContent: ''
    });
  },

  // 提交评论
  submitComment() {
    const that = this;
    const content = this.data.commentContent.trim();
    
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    if (!this.data.currentUser.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再评论',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin();
          }
        }
      });
      return;
    }

    const postId = this.data.postInfo.id;
    const token = Auth.getToken();

    wx.showLoading({ title: '发表中...' });

    wx.request({
      url: 'http://localhost:8081/comment/add',
      method: 'POST',
      header: {
        'Cookie': `satoken=${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        postId: postId,
        userId: this.data.currentUser.userId,
        content: content
      },
      success(res) {
        wx.hideLoading();
        console.log('发布评论响应:', res.data);
        
        if (res.data.code === 200) {
          wx.showToast({ title: '评论成功', icon: 'success' });
          
          that.setData({
            commentContent: '',
            showCommentInput: false
          });
          
          that.loadComments(postId, false);
        } else {
          wx.showToast({ title: res.data.msg || '评论失败', icon: 'none' });
        }
      },
      fail(err) {
        wx.hideLoading();
        console.error('评论失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 点赞评论
  likeComment: function (e) {
    const commentId = e.currentTarget.dataset.id;
    const that = this;
    
    if (!this.data.currentUser.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再点赞评论',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin();
          }
        }
      });
      return;
    }

    const commentList = this.data.commentList;
    const index = commentList.findIndex(item => item.id === commentId);

    if (index !== -1) {
      const comment = commentList[index];
      const isLiked = !comment.liked;
      const newLikeCount = isLiked ? (comment.likeCount + 1) : (comment.likeCount - 1);
      
      comment.liked = isLiked;
      comment.likeCount = newLikeCount;
      this.setData({ commentList: commentList });

      const token = Auth.getToken();
      
      wx.request({
        url: `http://localhost:8081/comment/like/${commentId}`,
        method: 'POST',
        header: {
          'Cookie': `satoken=${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          userId: this.data.currentUser.userId,
          isLiked: isLiked
        },
        fail(err) {
          console.error('评论点赞失败:', err);
          comment.liked = !isLiked;
          comment.likeCount = isLiked ? newLikeCount - 1 : newLikeCount + 1;
          that.setData({ commentList: commentList });
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      });
    }
  },

  // 删除评论
  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id;
    const comment = this.data.commentList.find(item => item.id === commentId);
    const that = this;
    
    if (!comment || !this.data.currentUser.isLoggedIn || 
        comment.userId !== this.data.currentUser.userId) {
      wx.showToast({ title: '只能删除自己的评论', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '提示',
      content: '确定要删除这条评论吗？',
      success: (res) => {
        if (res.confirm) {
          const token = Auth.getToken();
          wx.request({
            url: `http://localhost:8081/comment/delete/${commentId}`,
            method: 'DELETE',
            header: {
              'Cookie': `satoken=${token}`
            },
            success(res) {
              if (res.data.code === 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                that.loadComments(that.data.postInfo.id, false);
              } else {
                wx.showToast({ title: res.data.msg || '删除失败', icon: 'none' });
              }
            },
            fail(err) {
              console.error('删除评论失败:', err);
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 点赞帖子
  likePost() {
    const that = this;
    const postId = this.data.postInfo.id;

    if (!postId) {
      wx.showToast({ title: '帖子不存在', icon: 'none' });
      return;
    }

    if (!this.data.currentUser.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再点赞',
        confirmText: '去登录',
        success(res) {
          if (res.confirm) {
            that.doLogin();
          }
        }
      });
      return;
    }

    const token = Auth.getToken();
    const isLiked = this.data.isLiked;
    const oldLikeCount = this.data.postInfo.likeCount;
    const newLikeCount = isLiked ? oldLikeCount - 1 : oldLikeCount + 1;
    
    this.setData({
      'postInfo.likeCount': newLikeCount,
      isLiked: !isLiked
    });

    wx.vibrateShort({ type: 'light' });

    const url = isLiked ?
      `http://localhost:8081/post/unlike/${postId}` :
      `http://localhost:8081/post/like/${postId}`;

    wx.request({
      url: url,
      method: 'POST',
      header: {
        'Cookie': `satoken=${token}`,
        'Content-Type': 'application/json'
      },
      data: { userId: this.data.currentUser.userId },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const newCount = typeof res.data.data === 'number' ? res.data.data : newLikeCount;
          that.setData({ 'postInfo.likeCount': newCount });
          wx.showToast({ title: isLiked ? '取消点赞' : '点赞成功', icon: 'success', duration: 1000 });
        } else {
          that.setData({
            'postInfo.likeCount': oldLikeCount,
            isLiked: isLiked
          });
          wx.showToast({ title: res.data.msg || '操作失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('点赞请求失败:', err);
        that.setData({
          'postInfo.likeCount': oldLikeCount,
          isLiked: isLiked
        });
        wx.showToast({ title: '网络异常', icon: 'none' });
      }
    });
  },


  // 时间格式化
  formatTime(timeStr) {
    if (!timeStr) return "";
    
    try {
      let date;
      
      if (typeof timeStr === 'string') {
        if (timeStr.includes(' ') && timeStr.includes('-')) {
          const parts = timeStr.split(' ');
          const dateParts = parts[0].split('-');
          const timeParts = parts[1].split(':');
          date = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2]) || 0
          );
        } else if (timeStr.includes('T')) {
          date = new Date(timeStr);
        } else {
          date = new Date(timeStr);
        }
      } else {
        date = new Date(timeStr);
      }
      
      if (isNaN(date.getTime())) return "未知时间";
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      if (diff < 60000) return "刚刚";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (dateDay >= today) {
        return `${Math.floor(diff / 3600000)}小时前`;
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (dateDay >= yesterday) {
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `昨天 ${hour}:${minute}`;
      }
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${month}-${day} ${hour}:${minute}`;
      
    } catch (e) {
      console.error('时间格式化异常:', e);
      return "未知时间";
    }
  },

  // 跳转到作者主页
  goToAuthorHome: function (e) {
    const authorId = e.currentTarget.dataset.id || this.data.postAuthor.userId;
    if (authorId) {
      wx.navigateTo({ url: '/pages/man/man?id=' + authorId });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    const postId = this.data.postInfo.id;
    if (postId) {
      this.loadPostDetail(postId);
      this.loadComments(postId, false);
      setTimeout(() => wx.stopPullDownRefresh(), 1000);
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 图片加载失败处理
  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    const swiperList = this.data.swiperList;
    if (swiperList[index] && !swiperList[index].errorHandled) {
      swiperList[index].url = '/img/empty-following.png';
      swiperList[index].errorHandled = true;
      this.setData({ swiperList });
    }
  },

  // 头像加载失败处理
  onAvatarError(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'author') {
      this.setData({ 'postAuthor.avatar': '/images/default-avatar.png' });
    }
  },

  // 评论头像加载失败处理
  onCommentAvatarError(e) {
    const index = e.currentTarget.dataset.index;
    const commentList = this.data.commentList;
    if (commentList[index] && !commentList[index].avatarError) {
      commentList[index].avatar = '/images/default-avatar.png';
      commentList[index].avatarError = true;
      this.setData({ commentList });
    }
  },

  onHide() {
    console.log('页面隐藏');
  },

  onUnload() {
    console.log('页面卸载');
  }
});