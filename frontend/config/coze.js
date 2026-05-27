

module.exports = {
  COZE_BASE_URL: 'https://api.coze.cn',
  COZE_TOKEN:'切换成你的api密钥', 
  FOOD_WORKFLOW_ID: '7632372183293689907',

  get FOOD_WORKFLOW_URL() {
    return `${this.COZE_BASE_URL}/v1/workflow/run`;
  },
  
  EXERCISE_WORKFLOW_ID: '7632374013999022089', 
  get EXERCISE_WORKFLOW_URL() {
    return `${this.COZE_BASE_URL}/v1/workflow/run`;
  },
  
  TIMEOUT: 30000, // 30 秒

  get HEADERS() {
    return {
      'Authorization': `Bearer ${this.COZE_TOKEN}`,
      'Content-Type': 'application/json'
    };
  },
  
  ENABLE_FALLBACK: true,
  
  CONFIDENCE_THRESHOLD: 0.6,
  
  ENABLE_CACHE: true,

  CACHE_EXPIRY: 86400000, 

  FOOD_CACHE: {
    '苹果': { calories: 52, protein: 0.3, carb: 14, fat: 0.2 },
    '香蕉': { calories: 89, protein: 1.1, carb: 23, fat: 0.3 },
    '米饭': { calories: 130, protein: 2.7, carb: 28, fat: 0.3 },
    '鸡蛋': { calories: 155, protein: 13, carb: 1.1, fat: 11 },
    '牛奶': { calories: 42, protein: 3.4, carb: 5, fat: 1 },
  },
  
  EXERCISE_CACHE: {
    '跑步': { met: 8.0, category: '有氧运动' },
    '游泳': { met: 8.0, category: '有氧运动' },
    '瑜伽': { met: 2.5, category: '柔韧性运动' },
    '篮球': { met: 8.0, category: '有氧运动' },
    '快走': { met: 3.5, category: '有氧运动' },
  }
};
