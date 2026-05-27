const app = getApp();
const {
  request
} = require('../../utils/request.js');

Page({
  data: {
    keyword: '',

    //导航栏
    StatusBar: 0,
    CustomBar: 0,
    searchWidth: 0,
    searchHeight: 0,
    menuButtonInfo: {},
    autoFocus: true,
    specialsLoading: false,
    banners: [{
        id: 1,
        image: 'https://img2.baidu.com/it/u=3447638721,3138460313&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500'
      },
      {
        id: 2,
        image: 'https://img1.baidu.com/it/u=3341586322,1572192854&fm=253&fmt=auto&app=138&f=JPEG?w=759&h=330'
      },
      {
        id: 3,
        image: 'https://img1.baidu.com/it/u=10475850,2744212508&fm=253&fmt=auto&app=138&f=JPEG?w=633&h=398'
      }
    ],

    categories: [{
        id: 1,
        name: '热菜',
        icon: '🫕'
      },
      {
        id: 2,
        name: '主食',
        icon: '🍚'
      },
      {
        id: 3,
        name: '汤羹',
        icon: '🍲'
      },
      {
        id: 4,
        name: '小吃',
        icon: '🍢'
      },
      {
        id: 5,
        name: '海鲜',
        icon: '🦪'
      },
      {
        id: 6,
        name: '家常菜',
        icon: '🥗'
      },
      {
        id: 7,
        name: '川菜',
        icon: '🍱'
      },
      {
        id: 8,
        name: '凉菜',
        icon: '🥣'
      },
      {
        id: 9,
        name: '烤箱菜',
        icon: '🥃'
      },
      {
        id: 10,
        name: '更多',
        icon: '➕'
      }
    ],

    specials: [],
    recommendList: null,
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    showBackTop: false
  },

  async onLoad(options) {
    await app.waitForLogin();

    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar,
      searchWidth: app.globalData.searchWidth,
      searchHeight: app.globalData.menuButtonInfo.height - 2,
      menuButtonInfo: app.globalData.menuButtonInfo
    });

    this.loadRecommend(true);
    this.loadHotPosts();
  },

  // 加载热门帖子
  async loadHotPosts() {
    this.setData({
      specialsLoading: true
    });

    try {
      const res = await request({
        url: '/post/hot',
        method: 'GET'
      });

      if (res.code === 200 && res.data) {
        const specialsData = this.transformPostToSpecial(res.data);
        this.setData({
          specials: specialsData,
          specialsLoading: false
        });
        console.log('热门帖子加载成功，数量:', specialsData.length);
      } else {
        throw new Error(res.msg || '加载失败');
      }
    } catch (err) {
      console.error('获取热门帖子失败:', err);
      this.setData({
        specialsLoading: false
      });
      this.loadDefaultSpecials();
    }
  },

  // 将帖子数据转换为专题数据格式
  transformPostToSpecial(posts) {
    if (!posts || posts.length === 0) {
      return this.getDefaultSpecials();
    }

    return posts.map((post, index) => {
      let coverImage = '/images/default-cover.png';

      if (post.imageUrls) {
        try {
          if (typeof post.imageUrls === 'string') {
            if (post.imageUrls.startsWith('[')) {
              const images = JSON.parse(post.imageUrls);
              if (images && images.length > 0) {
                coverImage = images[0];
              }
            } else if (post.imageUrls.includes(',')) {
              coverImage = post.imageUrls.split(',')[0];
            } else if (post.imageUrls.startsWith('http')) {
              coverImage = post.imageUrls;
            }
          } else if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
            coverImage = post.imageUrls[0];
          }
        } catch (e) {
          console.error('解析图片失败:', e);
        }
      }

      // 处理描述
      let description = post.content || '';
      if (description.length > 40) {
        description = description.substring(0, 40) + '...';
      }

      // 处理标题
      let title = post.title || '热门推荐';
      if (title.length > 12) {
        title = title.substring(0, 12) + '...';
      }

      return {
        id: post.postId || post.id || index + 1,
        title: title,
        description: description,
        image: coverImage,
        likeCount: post.likeCount || 0,
        createdAt: post.createdAt,
        rawPost: post
      };
    });
  },

  // 获取默认专题数据
  getDefaultSpecials() {
    return [{
        id: 1,
        title: '今日推荐',
        description: '精选热门美食推荐',
        image: 'https://img2.baidu.com/it/u=3447638721,3138460313&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500',
        likeCount: 0
      },
      {
        id: 2,
        title: '人气爆款',
        description: '大家都在看的美食',
        image: 'https://img1.baidu.com/it/u=3341586322,1572192854&fm=253&fmt=auto&app=138&f=JPEG?w=759&h=330',
        likeCount: 0
      },
      {
        id: 3,
        title: '新手必学',
        description: '简单易做的家常菜',
        image: 'https://img1.baidu.com/it/u=10475850,2744212508&fm=253&fmt=auto&app=138&f=JPEG?w=633&h=398',
        likeCount: 0
      }
    ];
  },

  // 加载默认专题
  loadDefaultSpecials() {
    try {
      const cached = wx.getStorageSync('hotPostsCache');
      if (cached && cached.length > 0) {
        this.setData({
          specials: cached
        });
        console.log('使用缓存的热门帖子');
        return;
      }
    } catch (err) {
      console.error('读取缓存失败:', err);
    }

    this.setData({
      specials: this.getDefaultSpecials()
    });
  },

  // 缓存热门帖子
  cacheHotPosts(posts) {
    try {
      wx.setStorageSync('hotPostsCache', posts);
    } catch (err) {
      console.error('缓存失败:', err);
    }
  },

  onInput(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  clearInput() {
    this.setData({
      keyword: ''
    });
  },

  onSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      });
      return;
    }
    console.log('搜索关键词:', keyword);
    wx.navigateTo({
      url: '/pages/serchar/serchar?keyword=' + encodeURIComponent(keyword)
    });
  },

  goBack() {
    wx.navigateBack();
  },

  async onShow() {
    await app.waitForLogin();

    const lastRefresh = wx.getStorageSync('last_recommend_refresh');
    if (!lastRefresh || Date.now() - lastRefresh > 30 * 60 * 1000) {
      this.loadRecommend(true);
    }
  },

  onPullDownRefresh() {
    this.loadRecommend(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    console.log('点击分类:', category);
    wx.navigateTo({
      url: `/pages/category/category?selectedCuisine=${category}`
    });
  },

  onSpecialTap(e) {
    const special = e.currentTarget.dataset.special;
    if (special && special.id) {
      console.log('跳转帖子详情:', special.id);
      wx.navigateTo({
        url: `/pages/post/post?id=${special.id}`
      });
    } else {
      wx.showToast({
        title: special?.title || '暂无内容',
        icon: 'none'
      });
    }
  },

  onRecipeTap(e) {
    const recipeId = e.currentTarget.dataset.id;
    console.log('点击菜谱:', recipeId);
    wx.navigateTo({
      url: `/pages/card/card?recipeId=${recipeId}`
    });
  },

  loadRecommend(refresh = false) {
    if (refresh) {
      this.setData({
        page: 1,
        recommendList: [],
        hasMore: true
      });
    }

    if (!this.data.hasMore || this.data.loading) return;

    this.setData({
      loading: true
    });

    request({
      url: '/recipe/recommend',
      method: 'GET',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      }
    }).then(res => {
      if (res.code === 200) {
        const newList = res.data || [];
        const updatedList = refresh ? newList : [...this.data.recommendList, ...newList];

        this.setData({
          recommendList: updatedList,
          hasMore: newList.length === this.data.pageSize,
          loading: false
        });

        if (refresh) {
          wx.setStorageSync('last_recommend_refresh', Date.now());
        }

        console.log('推荐加载成功，数量:', updatedList.length);
      } else {
        console.error('推荐加载失败:', res.msg);
        this.setData({
          loading: false
        });
        wx.showToast({
          title: res.msg || '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('请求失败:', err);
      this.setData({
        loading: false
      });
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  loadMore() {
    this.setData({
      page: this.data.page + 1
    });
    this.loadRecommend(false);
  },

  onPageScroll(e) {
    this.setData({
      showBackTop: e.scrollTop > 500
    });
  },

  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  }
});