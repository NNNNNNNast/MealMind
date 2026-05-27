const COZE_CONFIG = {
  baseURL: 'https://api.coze.cn',
  token: '切换成你的api密钥'
};

const app = getApp();
const request = require('../../utils/request');

Page({
  data: {
    StatusBar: 0,
    CustomBar: 0,
    title_content: [
      "肚子空空了吗？",
      "不知道做什么菜？",
      "来和我互动吧!",
      "能在我这里找到灵感！"
    ],
    message: [],
    WelcomeMessage: [
      "欢迎来到AI智能严选厨房！👨‍🍳✨",
      "今天想吃点什么特别的？🤤🍕🍣",
      "把现有的食材告诉我，我来帮你搭配～🥦🍅🧄",
      "用美食治愈每一个日常。💕🥘☕",
      "你的专属美食灵感伙伴已上线！快来和我互动吧～👋😊🍳"
    ],
    submitValue: "",
    isThinking: false,
    scrollTop: 0,
    timer: null
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 关闭聊天页面
  closeChat() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/home/home' });
      }
    });
  },

  // 获取当前时间（时:分）
  getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({ scrollTop: 999999 });
  },

  // 添加用户消息
  addUserMessage(content) {
    const userMessage = {
      type: 'user',
      content: content,
      time: this.getCurrentTime()
    };
    this.setData({
      message: [...this.data.message, userMessage],
      submitValue: ""
    }, () => {
      this.scrollToBottom();
    });
  },

  // 添加机器人消息
  addBotMessage(res) {
    const htmlContent = app.globalData.markdownToHtml(res);
    const robotMessage = {
      type: 'robot',
      content: res,
      html: htmlContent,
      time: this.getCurrentTime()
    };
    this.setData({
      message: [...this.data.message, robotMessage]
    }, () => {
      this.scrollToBottom();
    });
  },

  // 添加欢迎消息
  addWelcomeBotMessage() {
    const randomIndex = Math.floor(Math.random() * this.data.WelcomeMessage.length);
    const welcomeText = this.data.WelcomeMessage[randomIndex];
    const htmlContent = app.globalData.markdownToHtml(welcomeText);
    const robotMessage = {
      type: 'robot',
      content: welcomeText,
      html: htmlContent,
      time: this.getCurrentTime()
    };
    this.setData({
      message: [...this.data.message, robotMessage]
    }, () => {
      this.scrollToBottom();
    });
  },

  // 获取健康档案
  async fetchHealthProfile() {
    try {
      const res = await request.get('/healthprofile/gethealthprofile');
      if (res.code === 200 && res.data) {
        const profile = res.data;
        return {
          age: profile.age || 0,
          gender: profile.gender === 1 ? '男' : profile.gender === 0 ? '女' : '未知',
          height: profile.height || 0,
          weight: profile.weight || 0,
          bmi: profile.bmi || 0,
          
          calorieGoal: profile.calorieGoal || 1800,
          proteinGoal: profile.proteinGoal || 60,
          carbGoal: profile.carbGoal || 200,
          fatGoal: profile.fatGoal || 60,
          
          dietGoal: profile.dietGoal || '',
          tastePreference: profile.tastePreference || '',
          avoidFoods: profile.avoidFoods || '',
          
          chronicDisease: profile.chronicDisease || '',
          smokingStatus: profile.smokingStatus === 1 ? '吸烟' : profile.smokingStatus === 0 ? '不吸烟' : '未知',
          exerciseFrequency: profile.exerciseFrequency || '',
          
          systolicBp: profile.systolicBp || 0,
          diastolicBp: profile.diastolicBp || 0,
          fastingGlucose: profile.fastingGlucose || 0
        };
      }
      return null;
    } catch (err) {
      console.error('健康档案请求失败:', err);
      return null;
    }
  },

  async runWorkflow(input, workflowId = '7620807980049186843') {
    if (!input || !input.trim()) {
      this.addBotMessage('输入内容不能为空');
      return;
    }
    
    if (!COZE_CONFIG.token) {
      this.addBotMessage('API配置错误，请联系管理员');
      return;
    }

    this.setData({ isThinking: true });

    try {
      const healthprofile = await this.fetchHealthProfile();
      const recentMessages = this.data.message.slice(-10);
      
      console.log('【AI 工作流】健康档案数据:', healthprofile);
      console.log('【AI 工作流】对话上下文:', recentMessages.length, '条消息');
      
      wx.request({
        url: `${COZE_CONFIG.baseURL}/v1/workflow/run`,
        method: 'POST',
        timeout: 30000,
        header: {
          'Authorization': `Bearer ${COZE_CONFIG.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          workflow_id: workflowId,
          parameters: {
            input: input,
            context: recentMessages,
            healthprofile: healthprofile
          }
        },
        success: (res) => {
          if (res.statusCode !== 200) {
            this.addBotMessage(`AI服务异常(${res.statusCode})`);
            this.setData({ isThinking: false });
            return;
          }

          let botResponse = this.extractResponseData(res.data);
          this.addBotMessage(botResponse || 'AI暂无回复');
          this.setData({ isThinking: false });
        },
        fail: (err) => {
          console.error('AI请求失败:', err);
          this.addBotMessage('网络请求失败，请检查网络');
          this.setData({ isThinking: false });
        }
      });

    } catch (err) {
      console.error('runWorkflow 异常:', err);
      this.addBotMessage('请求发生错误');
      this.setData({ isThinking: false });
    }
  },

  // 提取响应数据中的文本内容
  extractResponseData(data) {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return this.extractResponseData(parsed);
      } catch (e) {
        return data;
      }
    }

    if (Array.isArray(data)) {
      if (data.length > 0) {
        return this.extractResponseData(data[0]);
      }
      return '暂无回复';
    }

    if (data && typeof data === 'object') {
      if (data.data) {
        return this.extractResponseData(data.data);
      }
      if (data.output1) {
        return this.extractResponseData(data.output1);
      }

      const fields = ['content', 'output', 'text', 'message', 'reply', 'answer', 'response'];
      for (const field of fields) {
        if (data[field]) {
          return this.extractResponseData(data[field]);
        }
      }

      if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        const choice = data.choices[0];
        if (choice.message && choice.message.content) {
          return choice.message.content;
        }
        if (choice.text) {
          return choice.text;
        }
      }

      if (Object.keys(data).length === 0) {
        return '暂无回复';
      }

      try {
        return JSON.stringify(data);
      } catch (e) {
        return '无法解析的响应格式';
      }
    }

    return data ? String(data) : '暂无回复';
  },

  // 输入框内容变化
  onInput(e) {
    this.setData({ submitValue: e.detail.value });
  },

  // 确认发送消息
  onConfirm(e) {
    if (this.data.isThinking) return;
    
    const value = e.detail.value || this.data.submitValue;
    if (!value || value.trim() === "") return;

    this.addUserMessage(value);
    this.runWorkflow(value);
  },

  // 页面加载
  onLoad(options) {
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar
    });

    if (this.data.message.length > 0) {
      const initialMessage = this.data.message[0];
      initialMessage.time = this.getCurrentTime();
      this.setData({ message: [initialMessage] });
    }

    this.addWelcomeBotMessage();
  },

  // 页面显示
  onShow() {
    const message = wx.getStorageSync('inFoodMessage');
    if (message) {
      this.addUserMessage(message);
      this.runWorkflow(message);
      wx.removeStorageSync('inFoodMessage');
    }
  },

  // 页面卸载
  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  // 跳转食材扫描页
  onIngredientScan() {
    wx.navigateTo({ url: '/pages/in_food/in_food' });
  },

  // 跳转营养分析页
  onNutritionScan() {
    wx.navigateTo({ url: '/pages/ingredient_analysis/ingredient_analysis' });
  },

  // 跳转菜品记录页
  onDishRecord() {
    wx.navigateTo({ url: '/pages/recipe_analysis/recipe_analysis' });
  }
});