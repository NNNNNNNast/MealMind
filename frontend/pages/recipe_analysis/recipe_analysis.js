const COZE_CONFIG = {
  token: '切换成你的api密钥',
  baseURL: 'https://api.coze.cn'
};


const API_CONFIG = {
  baseURL: 'http://localhost:8082'
};

const TEST_USER_ID = '0007';
const app = getApp();

Page({
  data: {
    // 图片相关数据
    imageslist: [],        
    isAnalyzing: false,    
    isSaving: false,       
    analysisResult: '',  
    results: [],          
    currentImageUrl: '',  
    formData:{
      calories: 0,
      carb: 0,
      fat: 0,
      protein: 0
    },
    mealType: '',         

    // 导航栏相关数据
    StatusBar: 0,          // 状态栏高度
    CustomBar: 0,          // 自定义导航栏高度
  },

  //返回上一级页面
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  //格式化文件大小
  formatSize(size) {
    if (size < 1024) {
      return size + ' B';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  },

  uploadImageToCloud() {
    const that = this;
    const { imageslist } = this.data;

    return new Promise((resolve, reject) => {
      if (imageslist.length === 0) {
        reject(new Error('没有图片需要上传'));
        return;
      }

      wx.showLoading({
        title: '上传图片中...',
        mask: true
      });

      const image = imageslist[0];
      const cloudPath = `recipe_analysis/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: image.url,
        success: res => {
          console.log('上传成功:', res.fileID);
          wx.cloud.getTempFileURL({
            fileList: [res.fileID],
            success: urlRes => {
              wx.hideLoading();
              if (urlRes.fileList && urlRes.fileList.length > 0) {
                const imageUrl = urlRes.fileList[0].tempFileURL;
                that.setData({
                  currentImageUrl: imageUrl  
                });
                resolve(imageUrl);
              } else {
                reject(new Error('获取图片链接失败'));
              }
            },
            fail: err => {
              console.error('获取临时链接失败:', err);
              wx.hideLoading();
              reject(err);
            }
          });
        },
        fail: err => {
          console.error('上传失败:', err);
          wx.hideLoading();
          reject(err);
        }
      });
    });
  },

  //选择图片
  chooseImage() {
    const that = this;
    wx.chooseMedia({
      count: 1,                          
      mediaType: ['image'],              
      sourceType: ['album', 'camera'],    
      camera: 'back',                   
      success: function(res) {
        const file = res.tempFiles[0];
        const newImage = {
          id: `${Date.now()}_0`,
          url: file.tempFilePath,
          size: that.formatSize(file.size),
          name: '菜品图片'
        };

        that.setData({
          imageslist: [newImage],          
          analysisResult: '',             
          results: []                     
        });
      },
      fail: function(err) {
        if (err.errMsg && err.errMsg.includes('cancel')) {
          return;
        }
        console.error('chooseMedia传入错误:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  //删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const list = this.data.imageslist;
    list.splice(index, 1);
    this.setData({
      imageslist: list,
      analysisResult: '',  
      results: []          
    });
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.url;
    const urls = this.data.imageslist.map(item => item.url);
    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  //分析菜品
  analyzeIngredients() {
    const that = this;

    if (this.data.imageslist.length === 0) {
      wx.showToast({
        title: '请先上传图片',
        icon: 'none'
      });
      return;
    }

    if (!wx.cloud) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用云开发功能',
        showCancel: false
      });
      return;
    }

    this.setData({
      isAnalyzing: true,
      analysisResult: '',
      results: []
    });

    this.uploadImageToCloud().then(imageUrl => {
      const workflowId = '7620807218346967040';  
      const parameters = {
        "image": imageUrl 
      };

      console.log("Request parameters:", parameters);

      wx.request({
        url: `${COZE_CONFIG.baseURL}/v1/workflow/run`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${COZE_CONFIG.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          workflow_id: workflowId,
          parameters: parameters
        },
        success: (res) => {
          console.log("Coze Response:", res);
          
          if (res.statusCode === 200 && res.data.code === 0) {
            try {
              let workflowData = res.data.data;
              console.log("Workflow Data:", workflowData);

              if (typeof workflowData === 'string') {
                workflowData = JSON.parse(workflowData);
              }

              let content = '';
              if (workflowData.data) {
                let dataObj = workflowData.data;
                if (typeof dataObj === 'string') {
                  dataObj = JSON.parse(dataObj);
                }
                console.log("Parsed Data:", dataObj);
                content = `🍽️ 菜品名称：${dataObj.dish_name || '未知'}\n\n📝 菜品描述：\n${dataObj.dish_description || ''}\n\n📊 营养信息：\n- 热量：${dataObj.calories || '-'} kcal\n- 蛋白质：${dataObj.protein || '-'} g\n- 脂肪：${dataObj.fat || '-'} g\n- 碳水：${dataObj.carb || '-'} g`;

                that.setData({
                  'formData.fat': dataObj.fat,
                  'formData.carb': dataObj.carb,
                  'formData.calories': dataObj.calories,
                  'formData.protein': dataObj.protein,
                })
              } else if (workflowData.output) {
                content = workflowData.output;
              }
              
              console.log("Final Content:", content);

              that.setData({
                isAnalyzing: false,
                analysisResult: content,
               
              });

              wx.showToast({
                title: '识别成功',
                icon: 'success'
              });
            } catch (e) {
              console.error("解析响应失败", e);
              that.setData({
                isAnalyzing: false,
                analysisResult: "解析响应失败，请重试: " + e.message
              });
              wx.showToast({
                title: '解析失败',
                icon: 'none'
              });
            }
          } else {
            that.setData({
              isAnalyzing: false,
              analysisResult: `请求失败: ${res.data.msg || '未知错误'}`
            });
            wx.showToast({
              title: '请求失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error("请求失败", err);
          that.setData({
            isAnalyzing: false,
            analysisResult: "网络请求失败，请检查网络连接"
          });
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
        }
      });
    }).catch(err => {
      console.error('上传图片失败:', err);
      that.setData({
        isAnalyzing: false
      });
      wx.showToast({
        title: '图片上传失败',
        icon: 'none'
      });
    });
  },

  //复制
  copyResult() {
    wx.setClipboardData({
      data: this.data.analysisResult,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  //保存记录到数据库
  saveRecord() {
    const that = this;
    const { analysisResult, currentImageUrl } = this.data;

    // 验证是否有内容可保存
    if (!analysisResult) {
      wx.showToast({
        title: '没有可保存的内容',
        icon: 'none'
      });
      return;
    }

    // 设置保存状态
    this.setData({
      isSaving: true
    });
    
    // 传递营养数据和餐次类型
    app.globalData.addData = {
      ...this.data.formData,
      mealType: this.data.mealType
    };
    
    wx.switchTab({
      url:'/pages/status/status'
    })
  },

  onLoad(options) {
    if (options.mealType) {
      this.setData({
        mealType: options.mealType
      });
    }
    
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    })
  }
});