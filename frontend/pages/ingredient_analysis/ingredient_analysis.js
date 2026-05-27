const COZE_CONFIG = {
  token: '切换成你的api密钥',
  baseURL: 'https://api.coze.cn'
};

const app = getApp()

Page({
  data: {
    imageslist: [], 
    isAnalyzing: false, 
    analysisResult: '', 
    results: [], 
    analysisHtml: '',

    StatusBar: 0, 
    CustomBar: 0, 
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

  //上传图片到云存储
  uploadImagesToCloud() {
    const that = this;
    const {
      imageslist
    } = this.data;
    const uploadedUrls = [];

    return new Promise((resolve, reject) => {
      wx.showLoading({
        title: '上传图片中...',
        mask: true
      });

      const uploadNext = (index) => {
        if (index >= imageslist.length) {
          wx.hideLoading();
          resolve(uploadedUrls);
          return;
        }

        const image = imageslist[index];
        const cloudPath = `ingredient_analysis/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: image.url,
          success: res => {
            console.log('上传成功:', res.fileID);
            wx.cloud.getTempFileURL({
              fileList: [res.fileID],
              success: urlRes => {
                if (urlRes.fileList && urlRes.fileList.length > 0) {
                  uploadedUrls.push(urlRes.fileList[0].tempFileURL);
                  uploadNext(index + 1);
                } else {
                  wx.hideLoading();
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
      };

      uploadNext(0);
    });
  },

  //选择图片
  chooseImage() {
    const that = this;
    wx.chooseMedia({
      count: 9 - that.data.imageslist.length, 
      mediaType: ['image'], 
      sourceType: ['album', 'camera'], 
      camera: 'back',
      success: function (res) {
        const newImages = res.tempFiles.map((file, index) => ({
          id: `${Date.now()}_${index}`,
          url: file.tempFilePath,
          size: that.formatSize(file.size),
          name: `图片${that.data.imageslist.length + index + 1}`
        }));

        that.setData({
          imageslist: [...that.data.imageslist, ...newImages],
          analysisResult: '', 
          results: [] 
        });
      },
      fail: function (err) {
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

  previewImage(e) {
    const current = e.currentTarget.dataset.url;
    const urls = this.data.imageslist.map(item => item.url);
    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  //分析食材成分
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

    this.uploadImagesToCloud().then(imageUrls => {
      if (imageUrls.length === 0) {
        that.setData({
          isAnalyzing: false
        });
        return;
      }

      const workflowId = '7620808906479353892'; 
      const parameters = {
        "images": imageUrls 
      };

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
          console.log("Coze Response Data:", res.data);

          if (res.statusCode === 200 && res.data.code === 0) {
            try {
              let workflowData = res.data.data;
              console.log("Workflow Data:", workflowData);

              if (typeof workflowData === 'string') {
                try {
                  workflowData = JSON.parse(workflowData);
                  console.log("Parsed Workflow Data:", workflowData);
                } catch (e) {
                  console.log("Workflow data is not JSON:", workflowData);
                }
              }

              let contentStr = workflowData;
              console.log("Content Str Before Check:", contentStr);

              if (contentStr && contentStr.output) {
                contentStr = contentStr.output;
                console.log("Got content from output field:", contentStr);
              }
              else if (contentStr && contentStr.data) {
                contentStr = contentStr.data;
                console.log("Got content from data field:", contentStr);
              }
              else if (contentStr && contentStr.content) {
                contentStr = contentStr.content;
                console.log("Got content from content field:", contentStr);
              }

              console.log("Final Content:", contentStr);

              let resultText = typeof contentStr === 'string' ?
                contentStr :
                (contentStr && contentStr.suggestion ? contentStr.suggestion : '');
              const resultHtml = app.globalData.markdownToHtml(resultText);

              that.setData({
                isAnalyzing: false,
                results: contentStr && contentStr.foodslist ? contentStr.foodslist : [],
                analysisResult: resultText, 
                analysisHtml: resultHtml
              });

              wx.showToast({
                title: '识别成功',
                icon: 'success'
              });
            } catch (e) {
              console.error("解析响应失败", e);
              console.error("Error details:", e.stack);
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

  onLoad(options) {
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    })
    this.setData({
      marginTop:this.data.CustomBar + 5
    })
  },

});