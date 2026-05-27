# Status 页面餐食和运动记录改造说明

**改造日期：** 2026 年 4 月 24 日  
**改造目标：** 优化餐食记录流程，新增运动建议功能

---

## 📋 改造内容

### 1. 新增"今日运动建议"模块

#### 1.1 功能描述
- 📍 位置：餐食记录卡片底部，"已消耗"卡片之后
- 🎨 样式：紫色渐变背景卡片，区别于普通餐食卡片
- 💡 功能：展示 AI 生成的个性化运动建议（预留 AI 接口）

#### 1.2 UI 结构
```xml
<view class="meal-card exercise-suggestion-card">
  <view class="meal-header">
    <view class="meal-info">
      <view class="meal-icon">💡</view>
      <view class="meal-txt">
        <text class="m-name">今日运动建议</text>
        <text class="m-kcal">{{exerciseSuggestion.text}}</text>
      </view>
    </view>
    <view class="refresh-btn" bindtap="refreshExerciseSuggestion">
      <text class="cuIcon-refresh"></text>
    </view>
  </view>
  <view class="suggestion-content" wx:if="{{exerciseSuggestion.suggestions.length > 0}}">
    <view class="suggestion-item" wx:for="{{exerciseSuggestion.suggestions}}" wx:key="index">
      <view class="suggestion-icon">🏃‍♂️</view>
      <view class="suggestion-info">
        <text class="s-name">{{item.name}}</text>
        <text class="s-detail">{{item.duration}}分钟 | {{item.calories}}大卡</text>
      </view>
    </view>
  </view>
</view>
```

#### 1.3 数据结构
```javascript
exerciseSuggestion: {
  text: '根据你今日摄入 XXX 大卡，建议进行适量运动消耗多余热量',
  suggestions: [
    { name: '快走', duration: 30, calories: 150 },
    { name: '慢跑', duration: 20, calories: 200 },
    { name: '瑜伽', duration: 15, calories: 80 }
  ]
}
```

#### 1.4 相关方法
- `loadExerciseSuggestion()` - 加载运动建议（当前为模拟数据，预留 AI 接口）
- `refreshExerciseSuggestion()` - 刷新运动建议

#### 1.5 AI 接口集成点
```javascript
// TODO: 在 loadExerciseSuggestion 方法中调用 AI 接口
async loadExerciseSuggestion() {
  const suggestion = await request.post('/api/ai/exercise-suggestion', {
    userId: this.data.userId,
    todayKcal: this.data.kcal,
    // 其他健康数据...
  });
  
  this.setData({ exerciseSuggestion: suggestion });
}
```

---

### 2. 修改餐食记录流程

#### 2.1 改造前流程
```
用户输入食物 → 直接保存到数据库 → 更新 UI
```

#### 2.2 改造后流程
```
用户输入食物 → 显示数据确认弹窗 → 用户编辑确认 → 保存到数据库 → 更新 UI
     ↓
AI 识别结果 → 显示数据确认弹窗 → 用户编辑确认 → 保存到数据库 → 更新 UI
```

#### 2.3 新增数据确认弹窗

**功能：**
- ✅ 展示识别/计算出的食物营养数据
- ✅ 允许用户修改所有字段
- ✅ 用户确认后才保存到数据库

**UI 结构：**
```xml
<van-popup show="{{ showFoodConfirmPopup }}" position="bottom" round>
  <view class="food-confirm-popup">
    <view class="popup-header">
      <text class="popup-title">确认食物数据</text>
    </view>
    
    <view class="food-preview">
      <!-- 可编辑的食物字段 -->
      <view class="preview-item">
        <text class="preview-label">食物名称</text>
        <input value="{{tempFoodData.name}}" />
      </view>
      <view class="preview-item">
        <text class="preview-label">热量</text>
        <input type="number" value="{{tempFoodData.calories}}" />
      </view>
      <!-- 蛋白质、碳水、脂肪、份量... -->
    </view>
    
    <view class="confirm-hint">
      <text class="cuIcon-info"></text> 你可以修改以上数据，确保准确后再保存
    </view>
    
    <view class="popup-footer">
      <button class="cancel-btn">取消</button>
      <button class="confirm-btn">确认保存</button>
    </view>
  </view>
</van-popup>
```

**数据结构：**
```javascript
tempFoodData: {
  name: '',        // 食物名称
  calories: 0,     // 热量（大卡）
  protein: 0,      // 蛋白质（克）
  carb: 0,         // 碳水化合物（克）
  fat: 0,          // 脂肪（克）
  portion: '1 份'  // 份量
}
```

#### 2.4 修改的方法

**原方法：`confirmFoodInput()`**
- ❌ 修改前：直接保存食物数据
- ✅ 修改后：显示确认弹窗，等待用户确认

```javascript
// 修改后
confirmFoodInput() {
  if (!this.data.foodInput.trim()) {
    wx.showToast({ title: '请输入食物信息', icon: 'none' });
    return;
  }
  
  // 生成营养数据（后续改为 AI 识别）
  const foodData = {
    name: this.data.foodInput,
    calories: Math.floor(Math.random() * 100) + 50,
    protein: Math.floor(Math.random() * 10) + 1,
    carb: Math.floor(Math.random() * 20) + 5,
    fat: Math.floor(Math.random() * 8) + 1,
    portion: '1 份'
  };
  
  // 显示确认弹窗
  this.showFoodConfirmPopup(foodData);
  this.onCloseTextInputPopup();
}
```

**新增方法：`confirmFoodData()`**
- 用户点击"确认保存"时调用
- 将临时数据添加到餐食记录
- 更新总营养数据
- 保存到数据库

```javascript
confirmFoodData() {
  const { tempFoodData, currentMealType } = this.data;
  
  if (!tempFoodData.name) {
    wx.showToast({ title: '请输入食物名称', icon: 'none' });
    return;
  }
  
  // 添加到餐食记录
  const meals = { ...this.data.meals };
  meals[currentMealType].foods.push({ ...tempFoodData });
  meals[currentMealType].calories += tempFoodData.calories;
  this.setData({ meals });
  
  // 更新总营养数据
  const totalKcal = meals.breakfast.calories + meals.lunch.calories + 
                    meals.dinner.calories + meals.snack.calories;
  this.refreshNutritionUI({ kcal: totalKcal, ... });
  
  // 关闭弹窗
  this.onCloseFoodConfirmPopup();
  wx.showToast({ title: '保存成功', icon: 'success' });
  
  // 保存到数据库
  this.saveNutrition();
}
```

#### 2.5 AI 识别接口集成点

```javascript
// 预留方法：处理 AI 识别结果
handleAIRecognitionResult(aiResult) {
  // aiResult 应该包含：name, calories, protein, carb, fat, portion
  if (aiResult && aiResult.name) {
    this.showFoodConfirmPopup(aiResult);
  }
}

// 在 onDishRecord 方法中调用 AI 识别后，使用此方法处理结果
onDishRecord() {
  wx.navigateTo({ 
    url: `/pages/recipe_analysis/recipe_analysis?mealType=${this.data.currentMealType}` 
  });
  
  // AI 识别完成后，通过全局事件或回调获取结果
  // 然后调用：this.handleAIRecognitionResult(aiResult);
}
```

---

## 🎨 样式设计

### 1. 运动建议卡片样式
```css
.exercise-suggestion-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.exercise-suggestion-card .refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}
```

### 2. 数据确认弹窗样式
```css
.food-confirm-popup {
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
}

.preview-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #ecf0f1;
  border-radius: 12rpx;
  padding: 0 20rpx;
  background: #f9f9f9;
}

.confirm-hint {
  font-size: 24rpx;
  color: #f39c12;
  padding: 16rpx;
  background: rgba(243, 156, 18, 0.1);
  border-radius: 12rpx;
}
```

---

## 📊 数据流

### 1. 运动建议数据流
```
页面加载 → loadExerciseSuggestion() 
         → 生成/获取建议数据 
         → setData({ exerciseSuggestion }) 
         → 渲染 UI
         
用户点击刷新 → refreshExerciseSuggestion() 
            → 调用 AI 接口（TODO）
            → 更新建议数据
```

### 2. 餐食记录数据流
```
文本输入 → confirmFoodInput()
        → 生成临时数据
        → 显示确认弹窗
        
AI 识别 → handleAIRecognitionResult()
       → 传入 AI 结果
       → 显示确认弹窗

确认弹窗中 → 用户编辑数据
           → 点击确认
           → confirmFoodData()
           → 更新 meals 数据
           → 更新总营养
           → saveNutrition() → 数据库
```

---

## ✅ 功能清单

### 今日运动建议
- [x] UI 卡片设计（紫色渐变）
- [x] 数据展示区域
- [x] 刷新按钮
- [x] 加载方法（模拟数据）
- [x] 刷新方法
- [ ] AI 接口集成（TODO）

### 餐食记录确认
- [x] 数据确认弹窗 UI
- [x] 可编辑的营养字段
- [x] 临时数据存储
- [x] 字段编辑方法
- [x] 确认保存逻辑
- [x] 修改原有保存流程
- [ ] AI 识别结果处理（TODO 接口）

---

## 🔧 修改的文件

1. **pages/status/status.wxml**
   - 新增运动建议卡片（25 行）
   - 新增食物确认弹窗（63 行）

2. **pages/status/status.wxss**
   - 新增运动建议样式（80 行）
   - 新增确认弹窗样式（50 行）

3. **pages/status/status.js**
   - 新增 exerciseSuggestion 数据
   - 新增 tempFoodData 数据
   - 新增 loadExerciseSuggestion() 方法
   - 新增 refreshExerciseSuggestion() 方法
   - 新增 showFoodConfirmPopup() 方法
   - 新增 confirmFoodData() 方法
   - 新增一系列 tempFoodData 编辑方法
   - 修改 confirmFoodInput() 方法
   - 新增 handleAIRecognitionResult() 方法

---

## 🚀 后续开发建议

### 1. AI 运动建议集成
```javascript
// 建议的 API 接口设计
POST /api/ai/exercise-suggestion
Request: {
  userId: number,
  todayKcal: number,
  healthProfile: { age, gender, weight, height, ... }
}
Response: {
  text: string,
  suggestions: [
    { name: string, duration: number, calories: number }
  ]
}
```

### 2. AI 食物识别集成
```javascript
// 建议的 API 接口设计
POST /api/ai/food-recognition
Request: {
  image: base64,
  mealType: string
}
Response: {
  name: string,
  calories: number,
  protein: number,
  carb: number,
  fat: number,
  portion: string,
  confidence: number
}
```

### 3. 用户体验优化
- ✨ 添加食物数据历史记录
- ✨ 添加常用食物快捷选择
- ✨ 添加营养数据合理性校验
- ✨ 添加运动建议完成打卡功能

---

## 📝 测试要点

### 功能测试
- [ ] 运动建议卡片正常显示
- [ ] 刷新按钮功能正常
- [ ] 文本输入食物后显示确认弹窗
- [ ] AI 识别后显示确认弹窗（待 AI 接口）
- [ ] 确认弹窗中可编辑所有字段
- [ ] 确认后数据正确保存
- [ ] 取消后数据不保存

### 兼容性测试
- [ ] iOS 设备测试
- [ ] Android 设备测试
- [ ] 不同屏幕尺寸适配

---

**改造完成时间：** 2026 年 4 月 24 日  
**状态：** ✅ 已完成  
**下一步：** 集成 AI 接口
