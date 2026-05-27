const app = getApp();

Component({
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  /**
   * 组件的对外属性
   */
  properties: {
    bgColor: {
      type: String,
      default: ''
    }, 
    isCustom: {
      type: [Boolean, String],
      default: false
    },
    isBack: {
      type: [Boolean, String],
      default: false
    },
    bgImage: {
      type: String,
      default: ''
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    StatusBar: 20,  // 默认值，避免undefined
    CustomBar: 64,  // 默认值
    Custom: true
  },
  
  /**
   * 组件的生命周期函数
   */
  lifetimes: {
    attached: function() {
      // 组件挂载时获取最新的全局数据
      this.setSystemInfo();
    }
  },
  
  /**
   * 组件的方法列表
   */
  methods: {
    // 设置系统信息
    setSystemInfo: function() {
      // 从app.globalData获取数据，如果没有则使用默认值
      const globalData = app.globalData || {};
      
      this.setData({
        StatusBar: globalData.StatusBar || 20,
        CustomBar: globalData.CustomBar || 64,
        Custom: globalData.Custom !== undefined ? globalData.Custom : true
      });
      
      console.log('cu-custom 组件数据:', this.data);
    },
    
    BackPage: function() {
      this.triggerEvent('back'); 
    },
    
    toHome: function() {
      wx.reLaunch({
        url: '/pages/home/home',
      });
    }
  },
  
  // 旧版小程序兼容
  attached: function() {
    this.setSystemInfo();
  }
})