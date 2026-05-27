const app = getApp();
const request = require('../../utils/request');
const config = require('../../config/coze.js'); 
import { 
  genderOptions,
  tasteOptions, 
  healthGoalOptions, 
  gradientColors, 
  defaultFormData,
  nutritionConfig
} from '../../config/options';

Page({
  data: {
    StatusBar: 0,
    CustomBar: 0,
    userId: null,
    nickname: null,
    selDate: { year: 2024, month: 1, day: 1 },
    show: false,
    minDate: 0,
    maxDate: 0,
    defaultDate: 0,
    kcal: 0,
    protein: 0,
    carb: 0,
    fat: 0,
    bkcal: 0,
    bprotein: 0,
    bcarb: 0,
    bfat: 0,
    nutritionStatus: '数据待完善',
    remainingKcal: 1800,
    healthIndex: 50,
    healthLevel: '待改进',
    healthMessage: '',
    meals: {
      breakfast: { calories: 0, target: 600, foods: [] },
      lunch: { calories: 0, target: 800, foods: [] },
      dinner: { calories: 0, target: 400, foods: [] },
      snack: { calories: 0, target: 200, foods: [] },
      exercise: { calories: 0, foods: [] }
    },
    showMealRecordPopup: false,
    currentMealType: '',
    showTextInputPopup: false,
    foodInput: '',
    showExercisePopup: false,
    exerciseName: '',
    exerciseDuration: '',
    intensityLevel: 'medium',
    exerciseCalories: '',
    circleRotation: 0,
    nutritionConfig,
    showSliderPopup: false,
    sliderValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    pmin: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    pmax: { 
      1: nutritionConfig.kcal.max, 
      2: nutritionConfig.protein.max, 
      3: nutritionConfig.carb.max, 
      4: nutritionConfig.fat.max, 
      5: 100 
    },
    step: 1,
    gradientColor: gradientColors,
    showHealthPopup: false,
    formData: { 
      age: '',
      gender: 0,
      height: '',
      weight: '',
      dietGoal: '',
      tastePreference: '',
      avoidFoods: '',
      chronicDisease: '',
      smokingStatus: 0,
      exerciseFrequency: '',
      systolicBp: '',
      diastolicBp: '',
      fastingGlucose: ''
    },

    calorieGoal: 1800,
    carbGoal: 200,
    proteinGoal: 60,
    fatGoal: 60,
    bmiValue: '',
    weightStatusText: '',
    tasteTagsWithStatus: [],
    genderOptions,
    tasteOptions,
    isLoading: false,
    isReady: false,
    exerciseSuggestion: {
      text: '',
      suggestions: []
    },
    showFoodConfirmPopup: false,
    tempFoodData: {
      name: '',
      calories: 0,
      protein: 0,
      carb: 0,
      fat: 0,
      portion: '1 份'
    }
  },

  onLoad() {
    this.initBasicData();
    wx.nextTick(() => {
      this.loadData();
    });
  },

  onReady() {
    this.setData({ isReady: true });
  },

  onShow() {
    this.refreshUserId();
    this.handleAddData();
    if (!this.data.isLoading) {
      this.loadData();
      this.loadExerciseSuggestion();
      this.loadHealthIndex();
    }
  },

  initBasicData() {
    const today = new Date();
    const minDate = new Date(2020, 0, 1).getTime();
    const maxDate = today.getTime();
    const defaultDate = today.getTime();
    
    this.setData({
      StatusBar: app.globalData.StatusBar,
      CustomBar: app.globalData.CustomBar,
      userId: wx.getStorageSync('userId'),
      nickname: wx.getStorageSync('nickname'),
      selDate: {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      },
      minDate,
      maxDate,
      defaultDate
    });
    
    this.initTags();
  },

  initTags() {
    if (this.data.tasteTagsWithStatus.length === 0) {
      const tasteTagsWithStatus = this.data.tasteOptions.map(tag => ({ 
        label: tag.label, value: tag.value, active: false 
      }));
      this.setData({ tasteTagsWithStatus });
    }
  },

  refreshUserId() {
    const userId = wx.getStorageSync('userId');
    if (userId !== this.data.userId) {
      this.setData({ userId });
    }
  },

  async loadData() {
    if (this.data.isLoading) {
      return;
    }
    
    this.setData({ isLoading: true });
    
    try {
      const [healthRes, nutritionRes] = await Promise.all([
        this.fetchHealthProfile(),
        this.fetchDailyNutrition()
      ]);
      
      if (healthRes && healthRes.code === 200 && healthRes.data) {
        const profile = healthRes.data;

        const updateData = {
          calorieGoal: profile.calorieGoal || 1800,
          carbGoal: profile.carbGoal || 200,
          proteinGoal: profile.proteinGoal || 60,
          fatGoal: profile.fatGoal || 60,
          'formData.age': profile.age || '',
          'formData.gender': profile.gender || 0,
          'formData.height': profile.height || '',
          'formData.weight': profile.weight || '',
          'formData.dietGoal': profile.dietGoal || '',
          'formData.avoidFoods': profile.avoidFoods || '',
          'formData.chronicDisease': profile.chronicDisease || '',
          'formData.smokingStatus': profile.smokingStatus !== undefined ? profile.smokingStatus : 0,
          'formData.exerciseFrequency': profile.exerciseFrequency || '',
          'formData.systolicBp': profile.systolicBp || '',
          'formData.diastolicBp': profile.diastolicBp || '',
          'formData.fastingGlucose': profile.fastingGlucose || ''
        };
        
        if (profile.tastePreference) {
          try {
            let tastesArray = profile.tastePreference.split(',').map(s => s.trim());
            const tasteTagsWithStatus = this.data.tasteTagsWithStatus.map(tag => ({
              ...tag, active: tastesArray.includes(tag.value)
            }));
            updateData.tasteTagsWithStatus = tasteTagsWithStatus;
          } catch(e) {
            console.error("解析 tastePreference 失败", e);
          }
        }
        
        this.setData(updateData);
        this.calculateBMI();
      }
      
      if (nutritionRes && nutritionRes.code === 200) {
        this.refreshNutritionUI(nutritionRes.data);
      } else {
        this.refreshNutritionUI({ kcal: 0, protein: 0, carb: 0, fat: 0 });
      }
      
    } catch (err) {
      console.error('loadData 失败:', err);
      this.refreshNutritionUI({ kcal: 0, protein: 0, carb: 0, fat: 0 });
    } finally {
      this.setData({ isLoading: false, isReady: true });
    }
  },

  fetchHealthProfile() {
    return request.get('/healthprofile/gethealthprofile').catch(err => {
      console.error('健康档案请求失败:', err);
      return null;
    });
  },

  fetchDailyNutrition() {
    const { year, month, day } = this.data.selDate;
    const recordDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return request.get('/healthprofile/getnutrition', { recordDate }).catch(err => {
      console.error('营养数据请求失败:', err);
      return null;
    });
  },

  async saveNutrition() {
    const { year, month, day } = this.data.selDate;
    const recordDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    try {
      await request.post('/healthprofile/updatanutrition', {
        recordDate,
        kcal: this.data.kcal,
        protein: this.data.protein,
        carb: this.data.carb,
        fat: this.data.fat
      });
    } catch (err) {
      console.error('保存营养失败:', err);
    }
  },
  
  async loadHealthIndex() {
    try {
      const res = await request.get('/healthprofile/gethealthindex');
      if (res.code === 200 && res.data) {
        this.setData({
          healthIndex: res.data.healthIndex || 0,
          healthLevel: res.data.level || '待改进',
          healthMessage: res.data.message || ''
        });
      }
    } catch (err) {
      console.error('加载健康指数失败:', err);
      this.setData({
        healthIndex: 50,
        healthLevel: '待改进'
      });
    }
  },

  async saveMealRecords() {
    const { year, month, day } = this.data.selDate;
    const recordDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealRecords = {};
    
    mealTypes.forEach(type => {
      const meal = this.data.meals[type];
      if (meal && meal.foods && meal.foods.length > 0) {
        mealRecords[type] = meal.foods.map(food => ({
          foodName: food.name,
          calories: food.calories || 0,
          protein: food.protein || 0,
          carb: food.carb || 0,
          fat: food.fat || 0,
          portion: food.portion || '1 份'
        }));
      } else {
        mealRecords[type] = [];
      }
    });
    
    try {
      await request.post('/healthprofile/updatanutrition', {
        recordDate,
        kcal: this.data.kcal,
        protein: this.data.protein,
        carb: this.data.carb,
        fat: this.data.fat,
        mealRecords: JSON.stringify(mealRecords)
      });
    } catch (err) {
      console.error('保存餐食记录失败:', err);
    }
  },

  async saveExerciseRecords() {
    const { year, month, day } = this.data.selDate;
    const recordDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const exerciseFoods = this.data.meals.exercise?.foods || [];
    const exerciseRecords = exerciseFoods.map(ex => ({
      exerciseName: ex.name,
      duration: ex.duration || 0,
      calories: ex.calories || 0,
      intensity: ex.intensity || 'medium',
      category: ex.category || '未知',
      description: ex.description || ''
    }));
    
    const totalExerciseCalories = this.data.meals.exercise?.calories || 0;
    const netCalories = this.data.kcal - totalExerciseCalories;
    
    try {
      await request.post('/healthprofile/updatanutrition', {
        recordDate,
        kcal: this.data.kcal,
        protein: this.data.protein,
        carb: this.data.carb,
        fat: this.data.fat,
        exerciseRecords: JSON.stringify(exerciseRecords),
        exerciseCalories: totalExerciseCalories,
        netCalories: netCalories
      });
    } catch (err) {
      console.error('保存运动记录失败:', err);
    }
  },

  async saveAllRecords(mealsOverride = null, nutritionData = null) {
    const { year, month, day } = this.data.selDate;
    const recordDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const mealsToSave = mealsOverride || this.data.meals;
    
    const kcal = nutritionData ? nutritionData.kcal : this.data.kcal;
    const protein = nutritionData ? nutritionData.protein : this.data.protein;
    const carb = nutritionData ? nutritionData.carb : this.data.carb;
    const fat = nutritionData ? nutritionData.fat : this.data.fat;
    
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealRecords = {};
    
    mealTypes.forEach(type => {
      const meal = mealsToSave[type];
      if (meal && meal.foods && meal.foods.length > 0) {
        mealRecords[type] = meal.foods.map(food => ({
          foodName: food.name,
          calories: food.calories || 0,
          protein: food.protein || 0,
          carb: food.carb || 0,
          fat: food.fat || 0,
          portion: food.portion || '1 份'
        }));
      } else {
        mealRecords[type] = [];
      }
    });
    
    const exerciseFoods = mealsToSave.exercise?.foods || [];
    const exerciseRecords = exerciseFoods.map(ex => ({
      exerciseName: ex.name,
      duration: ex.duration || 0,
      calories: ex.calories || 0,
      intensity: ex.intensity || 'medium',
      category: ex.category || '未知',
      description: ex.description || ''
    }));
    
    const totalExerciseCalories = mealsToSave.exercise?.calories || 0;
    const netCalories = kcal - totalExerciseCalories;
    
    try {
      const res = await request.post('/healthprofile/updatanutrition', {
        recordDate,
        kcal,
        protein,
        carb,
        fat,
        mealRecords: JSON.stringify(mealRecords),
        exerciseRecords: JSON.stringify(exerciseRecords),
        exerciseCalories: totalExerciseCalories,
        netCalories: netCalories
      });
      
      // 保存成功后，重新加载健康指数
      await this.loadHealthIndex();
      
    } catch (err) {
      console.error('保存所有记录失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async saveHealthProfile() {
    const { formData, tasteTagsWithStatus } = this.data;
    
    if (!formData.age) {
      wx.showToast({ title: '请填写年龄', icon: 'none' });
      return;
    }
    if (!formData.height || !formData.weight) {
      wx.showToast({ title: '请填写身高体重', icon: 'none' });
      return;
    }
    if (!formData.dietGoal) {
      wx.showToast({ title: '请填写饮食目标', icon: 'none' });
      return;
    }
    if (!formData.avoidFoods) {
      wx.showToast({ title: '请填写忌口/过敏信息', icon: 'none' });
      return;
    }
    
    const selectedTastes = tasteTagsWithStatus.filter(t => t.active).map(t => t.value).join(',');
    
    const profileData = {
      age: parseInt(formData.age),
      gender: formData.gender,
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      dietGoal: formData.dietGoal,
      tastePreference: selectedTastes,
      avoidFoods: formData.avoidFoods,
      chronicDisease: formData.chronicDisease || '',
      smokingStatus: formData.smokingStatus,
      exerciseFrequency: formData.exerciseFrequency || '',
      systolicBp: formData.systolicBp ? parseFloat(formData.systolicBp) : null,
      diastolicBp: formData.diastolicBp ? parseFloat(formData.diastolicBp) : null,
      fastingGlucose: formData.fastingGlucose ? parseFloat(formData.fastingGlucose) : null,
      calorieGoal: formData.calorieGoal || 1800,
      carbGoal: formData.carbGoal || 200,
      proteinGoal: formData.proteinGoal || 60,
      fatGoal: formData.fatGoal || 60
    };
    
    try {
      const res = await request.post('/healthprofile/updatahealthprofile', profileData);
      if (res.code === 200) {
        wx.showToast({ title: '保存成功', icon: 'success' });
      
        this.setData({
          calorieGoal: profileData.calorieGoal || 1800,
          carbGoal: profileData.carbGoal || 200,
          proteinGoal: profileData.proteinGoal || 60,
          fatGoal: profileData.fatGoal || 60
        });
        
        // 传入 keepMeals 参数，保留食物记录
        const currentMeals = JSON.parse(JSON.stringify(this.data.meals));
        this.refreshNutritionUI({
          kcal: this.data.kcal,
          protein: this.data.protein,
          carb: this.data.carb,
          fat: this.data.fat,
          keepMeals: currentMeals
        });
        
        this.calculateBMI();
        this.onCloseHealthPopup();
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' });
      }
    } catch (err) {
      console.error('保存健康档案失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  refreshNutritionUI(data, shouldSave = false) {
    if (!data) {
      data = { kcal: 0, protein: 0, carb: 0, fat: 0 };
    }
    
    const kcal = data.kcal || 0;
    const protein = data.protein || 0;
    const carb = data.carb || 0;
    const fat = data.fat || 0;
    
    let mealRecords = {};
    let exerciseRecords = [];
    let exerciseCaloriesFromBackend = 0;
    
    if (data.mealRecords) {
      try {
        mealRecords = typeof data.mealRecords === 'string' ? JSON.parse(data.mealRecords) : data.mealRecords;
      } catch (e) {
        console.error('解析 mealRecords 失败:', e);
        mealRecords = {};
      }
    }
    
    if (data.exerciseRecords) {
      try {
        exerciseRecords = typeof data.exerciseRecords === 'string' ? JSON.parse(data.exerciseRecords) : data.exerciseRecords;
      } catch (e) {
        console.error('解析 exerciseRecords 失败:', e);
      }
    }
    
    if (data.exerciseCalories) {
      exerciseCaloriesFromBackend = data.exerciseCalories;
    }
    
    let meals;
    if (data.keepMeals) {
      meals = JSON.parse(JSON.stringify(data.keepMeals));
    } else {
      meals = {
        breakfast: { calories: 0, target: 600, foods: [] },
        lunch: { calories: 0, target: 800, foods: [] },
        dinner: { calories: 0, target: 400, foods: [] },
        snack: { calories: 0, target: 200, foods: [] },
        exercise: { calories: exerciseCaloriesFromBackend, foods: [] }
      };
      
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      mealTypes.forEach(type => {
        if (mealRecords[type] && mealRecords[type].length > 0) {
          mealRecords[type].forEach(record => {
            const food = {
              name: record.foodName,
              calories: record.calories || 0,
              protein: record.protein || 0,
              carb: record.carb || 0,
              fat: record.fat || 0,
              portion: record.portion || '1 份'
            };
            meals[type].foods.push(food);
            meals[type].calories += food.calories;
          });
        }
      });

      if (exerciseRecords && exerciseRecords.length > 0) {
        exerciseRecords.forEach(record => {
          const ex = {
            name: record.exerciseName,
            duration: record.duration || 0,
            intensity: record.intensity || 'medium',
            calories: record.calories || 0,
            category: record.category || '未知',
            description: record.description || '',
            time: new Date().toLocaleTimeString()
          };
          meals.exercise.foods.push(ex);
        });
      }
    }
    
    const calorieGoal = this.data.calorieGoal || 1800;
    const proteinGoal = this.data.proteinGoal || 60;
    const carbGoal = this.data.carbGoal || 200;
    const fatGoal = this.data.fatGoal || 60;
    
    const remainingKcal = Math.max(0, calorieGoal - kcal);
    
    const bkcal = Math.min((kcal / calorieGoal) * 100, 100);
    const bprotein = Math.min((protein / proteinGoal) * 100, 100);
    const bcarb = Math.min((carb / carbGoal) * 100, 100);
    const bfat = Math.min((fat / fatGoal) * 100, 100);
    
    let nutritionStatus = '数据待完善';
    if (kcal > 0) {
      if (kcal < calorieGoal * 0.8) nutritionStatus = '热量偏低';
      else if (kcal > calorieGoal * 1.2) nutritionStatus = '热量偏高';
      else nutritionStatus = '热量适中';
    }
    const percent = Math.min((kcal / calorieGoal) * 100, 100);
    const circleRotation = (percent / 100) * 360;
    
    this.setData({
      kcal, protein, carb, fat,
      bkcal, bprotein, bcarb, bfat,
      nutritionStatus,
      remainingKcal,
      circleRotation,
      meals,
      'sliderValue.1': kcal,
      'sliderValue.2': protein,
      'sliderValue.3': carb,
      'sliderValue.4': fat
    });
    
    if (shouldSave) {
      this.saveNutrition();
    }
  },

  fillHealthForm(profile) {
    if (!profile) return;
    
    this.setData({
      'formData.age': profile.age || '',
      'formData.gender': profile.gender || 0,
      'formData.height': profile.height || '',
      'formData.weight': profile.weight || '',
      'formData.dietGoal': profile.dietGoal || '',
      'formData.avoidFoods': profile.avoidFoods || '',
      'formData.chronicDisease': profile.chronicDisease || '',
      'formData.smokingStatus': profile.smokingStatus !== undefined ? profile.smokingStatus : 0,
      'formData.exerciseFrequency': profile.exerciseFrequency || '',
      'formData.systolicBp': profile.systolicBp || '',
      'formData.diastolicBp': profile.diastolicBp || '',
      'formData.fastingGlucose': profile.fastingGlucose || '',
      'formData.calorieGoal': profile.calorie_goal || 1800,
      'formData.carbGoal': profile.carb_goal || 200,
      'formData.proteinGoal': profile.protein_goal || 60,
      'formData.fatGoal': profile.fat_goal || 60,
      calorieGoal: profile.calorie_goal || 1800,
      carbGoal: profile.carb_goal || 200,
      proteinGoal: profile.protein_goal || 60,
      fatGoal: profile.fat_goal || 60
    });
    
    if (profile.tastePreference) {
      try {
        let tastesArray = profile.tastePreference.split(',').map(s => s.trim());
        const tasteTagsWithStatus = this.data.tasteTagsWithStatus.map(tag => ({
          ...tag, active: tastesArray.includes(tag.value)
        }));
        this.setData({ tasteTagsWithStatus });
      } catch(e) {
        console.error("解析 tastePreference 失败", e);
      }
    }
    
    this.calculateBMI();
  },

  prevDay() {
    const date = new Date(this.data.selDate.year, this.data.selDate.month - 1, this.data.selDate.day - 1);
    this.setData({
      selDate: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
    });
    this.loadData();
  },

  nextDay() {
    const date = new Date(this.data.selDate.year, this.data.selDate.month - 1, this.data.selDate.day + 1);
    this.setData({
      selDate: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      }
    });
    this.loadData();
  },

  onDisplay() {
    this.setData({ show: true });
  },
  
  onClose() {
    this.setData({ show: false });
  },
  
  onSelect(event) {
    const date = new Date(event.detail);
    this.setData({
      selDate: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      },
      show: false
    });
    this.loadData();
  },

  showPopup() {
    this.setData({ showSliderPopup: true });
  },
  
  PopupClose() {
    this.setData({ showSliderPopup: false });
  },
  
  onSliderDrag(event) {
    const { index } = event.currentTarget.dataset;
    const value = event.detail.value;
    const newSliderValue = { ...this.data.sliderValue };
    newSliderValue[index] = value;
    
    if (this.data.sliderValue[index] !== value) {
      this.refreshNutritionUI({
        kcal: newSliderValue[1],
        protein: newSliderValue[2],
        carb: newSliderValue[3],
        fat: newSliderValue[4]
      }, false);
    }
  },

  onSliderChange(event) {
    const { index } = event.currentTarget.dataset;
    const value = event.detail;
    const newSliderValue = { ...this.data.sliderValue };
    newSliderValue[index] = value;
    
    const currentMeals = JSON.parse(JSON.stringify(this.data.meals));
    
    const newNutrition = {
      kcal: newSliderValue[1],
      protein: newSliderValue[2],
      carb: newSliderValue[3],
      fat: newSliderValue[4]
    };
    
    this.refreshNutritionUI({
      ...newNutrition,
      keepMeals: currentMeals
    }, false);
    
    this.saveAllRecords(currentMeals, newNutrition);
  },

  saveSliderData() {
    this.saveNutrition();
    this.PopupClose();
    wx.showToast({ title: '保存成功', icon: 'success' });
    this.loadHealthIndex();
  },

  showHealthPopup() {
    this.setData({ showHealthPopup: true });
  },
  
  onCloseHealthPopup() {
    this.setData({ showHealthPopup: false });
  },

  recordMeal(e) {
    const mealType = e.currentTarget.dataset.mealType;
    this.setData({ currentMealType: mealType, showMealRecordPopup: true });
  },

  recordExercise() {
    this.setData({ showExercisePopup: true });
  },

  onCloseMealRecordPopup() {
    this.setData({ showMealRecordPopup: false });
  },

  showTextInput() {
    this.setData({ showMealRecordPopup: false, showTextInputPopup: true });
  },

  onCloseTextInputPopup() {
    this.setData({ showTextInputPopup: false, foodInput: '' });
  },

  onFoodInput(e) {
    this.setData({ foodInput: e.detail.value });
  },

  confirmFoodInput() {
    if (!this.data.foodInput.trim()) {
      wx.showToast({ title: '请输入食物信息', icon: 'none' });
      return;
    }
    
    const newFood = {
      name: this.data.foodInput,
      calories: Math.floor(Math.random() * 100) + 50,
      protein: Math.floor(Math.random() * 10) + 1,
      carb: Math.floor(Math.random() * 20) + 5,
      fat: Math.floor(Math.random() * 8) + 1,
      portion: '1 份'
    };
    
    const mealType = this.data.currentMealType;
    const meals = JSON.parse(JSON.stringify(this.data.meals));
    meals[mealType].foods.push(newFood);
    meals[mealType].calories += newFood.calories;
    this.setData({ meals });
    
    const totalKcal = meals.breakfast.calories + meals.lunch.calories + meals.dinner.calories + meals.snack.calories;
    const totalProtein = this.calculateTotalNutrient('protein');
    const totalCarb = this.calculateTotalNutrient('carb');
    const totalFat = this.calculateTotalNutrient('fat');
    
    this.refreshNutritionUI({ 
      kcal: totalKcal, 
      protein: totalProtein, 
      carb: totalCarb, 
      fat: totalFat,
      keepMeals: meals
    });
    this.onCloseTextInputPopup();
    
    this.saveAllRecords(meals);
    
    wx.showToast({ title: '记录成功', icon: 'success' });
  },
  
  calculateTotalNutrient(nutrient) {
    const meals = this.data.meals;
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    let total = 0;
    mealTypes.forEach(type => {
      meals[type].foods.forEach(food => {
        total += food[nutrient] || 0;
      });
    });
    return total;
  },

  async fetchCozeExerciseWorkflow(exerciseText) {
    return new Promise((resolve, reject) => {
      console.log('\n');
      console.log('='.repeat(60));
      console.log('【运动识别工作流】开始调用');
      console.log('='.repeat(60));
      console.log('📍 调用时间:', new Date().toLocaleString('zh-CN'));
      console.log('📍 输入文本:', exerciseText);
      console.log('📍 API URL:', `${config.COZE_BASE_URL}/v1/workflow/run`);
      console.log('📍 WorkFlow ID:', config.EXERCISE_WORKFLOW_ID);
      console.log('📍 Token 配置:', config.COZE_TOKEN ? config.COZE_TOKEN.substring(0, 15) + '...' : '❌ 未配置');
      console.log('📍 Token 长度:', config.COZE_TOKEN ? config.COZE_TOKEN.length : 0);
      console.log('📍 请求参数:', { input: exerciseText });
      console.log('='.repeat(60));
      
      wx.request({
        url: `${config.COZE_BASE_URL}/v1/workflow/run`,
        method: 'POST',
        timeout: 60000,
        header: {
          'Authorization': `Bearer ${config.COZE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          workflow_id: config.EXERCISE_WORKFLOW_ID,
          parameters: {
            input: exerciseText  
          }
        },
        success: (res) => {
          console.log('\n');
          console.log('='.repeat(60));
          console.log('【运动识别工作流】收到响应');
          console.log('='.repeat(60));
          console.log('📍 响应时间:', new Date().toLocaleString('zh-CN'));
          console.log('📍 状态码:', res.statusCode);
          console.log('📍 响应数据预览:', JSON.stringify(res.data).substring(0, 200) + '...');
          
          if (res.statusCode !== 200) {
            console.error('❌ 运动工作流调用失败，状态码:', res.statusCode);
            console.log('完整响应:', res);
            resolve(null);
            return;
          }
          
          let exerciseData = null;
          
          console.log('\n【步骤 1】解析响应数据结构...');
          console.log('原始响应数据类型:', typeof res.data);
          console.log('res.data 是否有 data 字段:', res.data && res.data.data ? '✅ 有' : '❌ 没有');
          console.log('res.data.data 类型:', res.data && res.data.data ? typeof res.data.data : 'N/A');

          let workflowOutput = null;
          
          if (res.data && res.data.data) {
            if (typeof res.data.data === 'string') {
              console.log('📍 res.data.data 是字符串，尝试解析...');
              try {
                const parsedData = JSON.parse(res.data.data);
                workflowOutput = parsedData;
                console.log('✅ 解析成功，workflowOutput:', workflowOutput);
                console.log('workflowOutput 字段:', Object.keys(workflowOutput));
              } catch (e) {
                console.error('❌ 解析 res.data.data 失败:', e);
                console.error('原始字符串:', res.data.data);
                workflowOutput = res.data;
              }
            } else {
              workflowOutput = res.data.data;
              console.log('📍 res.data.data 是对象:', workflowOutput);
              console.log('workflowOutput 字段:', Object.keys(workflowOutput));
            }
          } else {
            console.warn('⚠️ res.data.data 不存在，使用 res.data');
            workflowOutput = res.data;
          }
          
          console.log('\n【步骤 2】从工作流输出中提取数据...');
          console.log('workflowOutput 结构:', workflowOutput);
          
          if (workflowOutput) {
            if (workflowOutput.result) {
              console.log('📍 检测到 result 字段，类型:', typeof workflowOutput.result);
              if (typeof workflowOutput.result === 'string') {
                console.log('📍 result 是字符串，尝试解析...');
                try {
                  exerciseData = JSON.parse(workflowOutput.result);
                  console.log('✅ 解析 result 字符串成功:', exerciseData);
                } catch (e) {
                  console.error('❌ 解析 result JSON 失败:', e);
                  console.error('result 原始内容:', workflowOutput.result);
                }
              } else {
                exerciseData = workflowOutput.result;
                console.log('📍 result 是对象:', exerciseData);
              }
            }
            else if (workflowOutput.output) {
              console.log('📍 检测到 output 字段，尝试解析...');
              try {
  
                exerciseData = JSON.parse(workflowOutput.output);
                console.log('✅ 从 output 字段提取数据:', exerciseData);
                console.log('exerciseData 字段:', Object.keys(exerciseData));
              } catch (e) {
                console.error('❌ 解析 output JSON 失败:', e);
                console.error('output 原始内容:', workflowOutput.output);
              }
            }
            else if (workflowOutput.data) {
              console.log('📍 检测到 data 字段...');
              exerciseData = workflowOutput.data;
              console.log('从 data 字段提取数据:', exerciseData);
            }
          }
          
          console.log('\n【步骤 3】验证数据有效性...');
          console.log('exerciseData:', exerciseData);
          console.log('duration 类型:', typeof exerciseData?.duration);
          console.log('duration 值:', exerciseData?.duration);
          
          if (exerciseData && typeof exerciseData.duration === 'number') {
            console.log('✅ 数据验证通过，运动识别成功!');
            const result = {
              name: exerciseData.name || '未知运动',
              duration: exerciseData.duration,
              intensity: exerciseData.intensity || 'medium',
              metValue: exerciseData.met_value || 5.0,
              caloriesPerHour: exerciseData.calories_per_hour || 300,
              description: exerciseData.description || '',
              confidence: exerciseData.confidence || 0.5,
              category: exerciseData.category || '有氧运动'
            };
            console.log('📍 最终提取结果:', result);
            console.log('='.repeat(60));
            console.log('【运动识别工作流】调用完成 ✅');
            console.log('='.repeat(60));
            console.log('\n');
            resolve(result);
          } else {
            console.warn('❌ 数据验证失败：duration 不是数字类型');
            console.warn('exerciseData:', exerciseData);
            console.log('='.repeat(60));
            console.log('【运动识别工作流】调用失败 ❌');
            console.log('='.repeat(60));
            console.log('\n');
            resolve(null);
          }
        },
        fail: (err) => {
          console.log('\n');
          console.log('='.repeat(60));
          console.log('【运动识别工作流】请求失败 ❌');
          console.log('='.repeat(60));
          console.log('📍 失败时间:', new Date().toLocaleString('zh-CN'));
          console.error('错误信息:', err);
          console.error('错误详情:', err.errMsg);
          
          let errorMsg = '网络请求失败';
          if (err.errMsg && err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请检查：\n1. 工作流是否已发布\n2. WorkFlow ID 是否正确\n3. Token 是否有效';
            console.error('❌ 可能原因：请求超时');
          } else if (err.errMsg && err.errMsg.includes('401')) {
            errorMsg = 'Token 无效，请检查配置';
            console.error('❌ 可能原因：Token 无效 (401)');
          } else if (err.errMsg && err.errMsg.includes('404')) {
            errorMsg = 'WorkFlow ID 错误或工作流未发布';
            console.error('❌ 可能原因：WorkFlow ID 错误 (404)');
          } else if (err.errMsg && err.errMsg.includes('fail')) {
            errorMsg = '网络连接失败，请检查网络';
            console.error('❌ 可能原因：网络连接失败');
          }
          
          console.error('错误提示:', errorMsg);
          console.log('='.repeat(60));
          console.log('【运动识别工作流】调用终止');
          console.log('='.repeat(60));
          console.log('\n');
          
          wx.showModal({
            title: '请求失败',
            content: errorMsg,
            showCancel: false
          });
          
          resolve(null);
        }
      });
    });
  },

  // 基础事件处理方法
  onCloseExercisePopup() {
    this.setData({ 
      showExercisePopup: false, 
      exerciseName: '',
      exerciseDuration: '',
      intensityLevel: 'medium'
    });
  },

  onExerciseNameInput(e) {
    this.setData({ exerciseName: e.detail.value });
  },

  onExerciseDurationInput(e) {
    this.setData({ exerciseDuration: e.detail.value });
  },

  onIntensityChange(e) {
    const intensity = e.currentTarget.dataset.intensity;
    this.setData({ intensityLevel: intensity });
  },

  estimateCalories(name, duration, intensity) {
    const weight = parseFloat(this.data.formData.weight) || 60;
    
    const metValues = {
      low: 3,     
      medium: 5, 
      high: 8      
    };
    
    const met = metValues[intensity] || 5;
    const durationHours = duration / 60;
    const calories = Math.round(met * weight * durationHours);
    return calories;
  },

  async confirmExerciseInput() {
    const { exerciseName, exerciseDuration, intensityLevel } = this.data;
    
    if (!exerciseName || !exerciseName.trim()) {
      wx.showToast({ title: '请输入运动名称', icon: 'none' });
      return;
    }
    
    const duration = parseInt(exerciseDuration);
    if (isNaN(duration) || duration <= 0) {
      wx.showToast({ title: '请输入有效的运动时长', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '分析中...' });
    
    try {

      const exerciseText = `${exerciseName} ${duration}分钟 ${intensityLevel === 'low' ? '低强度' : intensityLevel === 'high' ? '高强度' : '中强度'}`;
      
      const exerciseData = await this.fetchCozeExerciseWorkflow(exerciseText);
      
      if (exerciseData) {
        if (exerciseData.confidence < 0.6) {
          wx.showModal({
            title: '提示',
            content: `识别结果置信度较低 (${(exerciseData.confidence * 100).toFixed(0)}%)，${exerciseData.description}`,
            showCancel: false
          });
        }
        
        const weight = parseFloat(this.data.formData.weight) || 60;
        const durationHours = exerciseData.duration / 60;
        const estimatedCalories = Math.round(exerciseData.metValue * weight * durationHours);
        

        // 深拷贝 meals 对象，避免引用问题
        const meals = JSON.parse(JSON.stringify(this.data.meals));
        meals.exercise.calories = estimatedCalories;
        meals.exercise.foods.push({
          name: exerciseData.name,
          duration: exerciseData.duration,
          intensity: exerciseData.intensity,
          calories: estimatedCalories,
          category: exerciseData.category,
          description: exerciseData.description,
          time: new Date().toLocaleTimeString()
        });
        this.setData({ meals });
        
        const remainingKcal = Math.max(0, this.data.calorieGoal - this.data.kcal + estimatedCalories);
        this.setData({ remainingKcal });
        
        wx.showToast({
          title: `记录成功！消耗 ${estimatedCalories} 大卡`,
          icon: 'success'
        });
        
        this.saveAllRecords();
        
        this.onCloseExercisePopup();
      } else {
        const mockCalories = this.estimateCalories(exerciseName, duration, intensityLevel);
        
        // 深拷贝 meals 对象，避免引用问题
        const meals = JSON.parse(JSON.stringify(this.data.meals));
        meals.exercise.calories = mockCalories;
        meals.exercise.foods.push({
          name: exerciseName,
          duration: duration,
          intensity: intensityLevel,
          calories: mockCalories,
          time: new Date().toLocaleTimeString()
        });
        this.setData({ meals });
        
        const remainingKcal = Math.max(0, this.data.calorieGoal - this.data.kcal + mockCalories);
        this.setData({ remainingKcal });
        
        wx.showModal({
          title: '提示',
          content: '运动识别服务暂时不可用，已使用估算数据',
          showCancel: false
        });
        
        this.saveAllRecords();
        
        this.onCloseExercisePopup();
      }
    } catch (err) {
      console.error('运动识别错误:', err);
      wx.showToast({ title: '识别失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  
  onAgeInput(e) {
    this.setData({ 'formData.age': e.detail.value });
  },
  
  onGenderChange(e) {
    this.setData({ 'formData.gender': parseInt(e.detail.value) });
  },
  
  onHeightInput(e) {
    this.setData({ 'formData.height': e.detail.value });
    this.calculateBMI();
  },
  
  onWeightInput(e) {
    this.setData({ 'formData.weight': e.detail.value });
    this.calculateBMI();
  },
  
  onDietGoalInput(e) {
    this.setData({ 'formData.dietGoal': e.detail.value });
  },
  
  onAvoidFoodsInput(e) {
    this.setData({ 'formData.avoidFoods': e.detail.value });
  },
  
  onChronicDiseaseInput(e) {
    this.setData({ 'formData.chronicDisease': e.detail.value });
  },
  
  onSmokingStatusChange(e) {
    this.setData({ 'formData.smokingStatus': parseInt(e.detail.value) });
  },
  
  onExerciseFrequencyInput(e) {
    this.setData({ 'formData.exerciseFrequency': e.detail.value });
  },
  
  onSystolicBpInput(e) {
    this.setData({ 'formData.systolicBp': e.detail.value });
  },
  
  onDiastolicBpInput(e) {
    this.setData({ 'formData.diastolicBp': e.detail.value });
  },
  
  onFastingGlucoseInput(e) {
    this.setData({ 'formData.fastingGlucose': e.detail.value });
  },
  
  onCalorieGoalInput(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({ 'formData.calorieGoal': value });
  },

  onCarbGoalInput(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({ 'formData.carbGoal': value });
  },

  onProteinGoalInput(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({ 'formData.proteinGoal': value });
  },

  onFatGoalInput(e) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({ 'formData.fatGoal': value });
  },

  setDietGoal(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ 'formData.dietGoal': value });
  },
  
  setExerciseFrequency(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ 'formData.exerciseFrequency': value });
  },
  
  calculateBMI() {
    const { height, weight } = this.data.formData;
    if (!height || !weight) {
      this.setData({ bmiValue: '', weightStatusText: '' });
      return;
    }
    
    const heightM = parseFloat(height) / 100;
    const weightNum = parseFloat(weight);
    const bmi = (weightNum / (heightM * heightM)).toFixed(1);
    
    let weightStatusText = '';
    if (bmi < 18.5) {
      weightStatusText = '体重过低';
    } else if (bmi < 24) {
      weightStatusText = '正常范围';
    } else if (bmi < 28) {
      weightStatusText = '超重';
    } else {
      weightStatusText = '肥胖';
    }
    
    this.setData({
      bmiValue: bmi,
      weightStatusText: weightStatusText
    });
  },
  
  toggleTaste(e) {
    const value = e.currentTarget.dataset.value;
    const tasteTagsWithStatus = this.data.tasteTagsWithStatus.map(tag => ({
      ...tag,
      active: tag.value === value ? !tag.active : tag.active
    }));
    this.setData({ tasteTagsWithStatus });
  },
  
  handleAddData() {
    if (app.globalData.addData) {
      this.accumulateNutrition(app.globalData.addData);
      app.globalData.addData = null;
    }
  },

  accumulateNutrition(addData) {
    const { calories, protein, carb, fat, mealType } = addData;
    
    const newKcal = (this.data.kcal || 0) + (calories || 0);
    const newProtein = (this.data.protein || 0) + (protein || 0);
    const newCarb = (this.data.carb || 0) + (carb || 0);
    const newFat = (this.data.fat || 0) + (fat || 0);
    
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (mealType && validMealTypes.includes(mealType) && this.data.meals[mealType]) {
      const meals = JSON.parse(JSON.stringify(this.data.meals));
      meals[mealType].calories += (calories || 0);
      meals[mealType].foods.push({
        name: 'AI 识别菜品',
        calories: calories || 0,
        protein: protein || 0,
        carb: carb || 0,
        fat: fat || 0,
        portion: '1 份'
      });
      this.setData({ meals });
    }
    
    this.refreshNutritionUI({ 
      kcal: newKcal, 
      protein: newProtein, 
      carb: newCarb, 
      fat: newFat,
      keepMeals: meals
    }, true);
  },

  onDishRecord() {
    wx.navigateTo({ url: `/pages/recipe_analysis/recipe_analysis?mealType=${this.data.currentMealType}` });
  },

  goAI() {
    wx.navigateTo({ url: '/pages/ai_kitchen/ai_kitchen' });
  },

  goBack() {
    wx.navigateBack();
  },

  loadExerciseSuggestion() {

    const mockSuggestions = [
      { name: '快走', duration: 30, calories: 150 },
      { name: '慢跑', duration: 20, calories: 200 },
      { name: '瑜伽', duration: 15, calories: 80 }
    ];
    
    this.setData({
      exerciseSuggestion: {
        text: `根据你今日摄入${this.data.kcal}大卡，建议进行适量运动消耗多余热量`,
        suggestions: mockSuggestions
      }
    });
  },

  refreshExerciseSuggestion() {
    wx.showLoading({ title: '生成中...' });
    setTimeout(() => {
      this.loadExerciseSuggestion();
      wx.hideLoading();
      wx.showToast({ title: '已更新', icon: 'success' });
    }, 1000);
  },

  showFoodConfirmPopup(foodData) {
    console.log('\n【显示确认弹窗】准备显示...');
    console.log('foodData:', foodData);
    console.log('currentMealType:', this.data.currentMealType);
    
    this.setData({
      tempFoodData: foodData,
      showFoodConfirmPopup: true
    });
    
    console.log('✅ 确认弹窗已显示');
  },

  onCloseFoodConfirmPopup() {
    this.setData({
      showFoodConfirmPopup: false,
      tempFoodData: {
        name: '',
        calories: 0,
        protein: 0,
        carb: 0,
        fat: 0,
        portion: '1 份'
      }
    });
  },

  onTempFoodNameChange(e) {
    this.setData({ 'tempFoodData.name': e.detail.value });
  },

  onTempFoodCaloriesChange(e) {
    this.setData({ 'tempFoodData.calories': parseInt(e.detail.value) || 0 });
  },

  onTempFoodProteinChange(e) {
    this.setData({ 'tempFoodData.protein': parseInt(e.detail.value) || 0 });
  },

  onTempFoodCarbChange(e) {
    this.setData({ 'tempFoodData.carb': parseInt(e.detail.value) || 0 });
  },

  onTempFoodFatChange(e) {
    this.setData({ 'tempFoodData.fat': parseInt(e.detail.value) || 0 });
  },

  onTempFoodPortionChange(e) {
    this.setData({ 'tempFoodData.portion': e.detail.value });
  },


  confirmFoodData() {
    const { tempFoodData, currentMealType } = this.data;
    
    if (!tempFoodData.name) {
      wx.showToast({ title: '请输入食物名称', icon: 'none' });
      return;
    }
    
    const meals = JSON.parse(JSON.stringify(this.data.meals));
    meals[currentMealType].foods.push({ ...tempFoodData });
    meals[currentMealType].calories += tempFoodData.calories;
    
    this.setData({ meals });
    
    const totalKcal = meals.breakfast.calories + meals.lunch.calories + meals.dinner.calories + meals.snack.calories;
    const totalProtein = this.calculateTotalNutrient('protein');
    const totalCarb = this.calculateTotalNutrient('carb');
    const totalFat = this.calculateTotalNutrient('fat');
    
    this.refreshNutritionUI({ 
      kcal: totalKcal, 
      protein: totalProtein, 
      carb: totalCarb, 
      fat: totalFat,
      keepMeals: meals
    });
    
    this.saveAllRecords(meals);

    this.onCloseFoodConfirmPopup();
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  async fetchCozeWorkflowNutrition(foodText) {
    return new Promise((resolve, reject) => {
      console.log('\n');
      console.log('='.repeat(60));
      console.log('【食物识别工作流】开始调用');
      console.log('='.repeat(60));
      console.log('📍 调用时间:', new Date().toLocaleString('zh-CN'));
      console.log('📍 输入文本:', foodText);
      console.log('📍 API URL:', `${config.COZE_BASE_URL}/v1/workflow/run`);
      console.log('📍 WorkFlow ID:', config.FOOD_WORKFLOW_ID);
      console.log('📍 Token 配置:', config.COZE_TOKEN ? config.COZE_TOKEN.substring(0, 15) + '...' : '❌ 未配置');
      console.log('📍 Token 长度:', config.COZE_TOKEN ? config.COZE_TOKEN.length : 0);
      console.log('='.repeat(60));
      
      if (!config.FOOD_WORKFLOW_ID || config.FOOD_WORKFLOW_ID === '7xxxxxxxxxxxxxx') {
        console.error('❌ WorkFlow ID 未配置！请在 config/coze.js 中填写正确的 ID');
        wx.showModal({
          title: '配置错误',
          content: 'WorkFlow ID 未配置，请查看配置说明文档',
          showCancel: false
        });
        resolve(null);
        return;
      }
      
      if (!config.COZE_TOKEN || config.COZE_TOKEN === 'pat_xxxxxxxxxxxxx') {
        console.error('❌ Token 未配置！请在 config/coze.js 中填写正确的 Token');
        wx.showModal({
          title: '配置错误',
          content: 'Token 未配置，请查看配置说明文档',
          showCancel: false
        });
        resolve(null);
        return;
      }
      
      console.log('⏳ 正在发送请求...');
      
      wx.request({
        url: `${config.COZE_BASE_URL}/v1/workflow/run`,
        method: 'POST',
        timeout: 60000,  
        header: {
          'Authorization': `Bearer ${config.COZE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          workflow_id: config.FOOD_WORKFLOW_ID,
          parameters: {
            food_text: foodText
          }
        },
        success: (res) => {
          console.log('\n');
          console.log('='.repeat(60));
          console.log('【食物识别工作流】收到响应');
          console.log('='.repeat(60));
          console.log('📍 响应时间:', new Date().toLocaleString('zh-CN'));
          console.log('📍 状态码:', res.statusCode);
          console.log('📍 响应数据预览:', JSON.stringify(res.data).substring(0, 200) + '...');
          
          if (res.statusCode !== 200) {
            console.error('❌ 工作流调用失败，状态码:', res.statusCode);
            console.log('完整响应:', res);
            wx.showToast({
              title: `请求失败 (${res.statusCode})`,
              icon: 'none'
            });
            resolve(null);
            return;
          }
          

          let nutritionData = null;
          
          console.log('\n【步骤 1】解析响应数据结构...');
          console.log('原始响应数据类型:', typeof res.data);
          console.log('res.data 是否有 data 字段:', res.data && res.data.data ? '✅ 有' : '❌ 没有');
          console.log('res.data.data 类型:', res.data && res.data.data ? typeof res.data.data : 'N/A');

          let workflowOutput = null;
          
          if (res.data && res.data.data) {
            if (typeof res.data.data === 'string') {
              console.log('📍 res.data.data 是字符串，尝试解析...');
              try {
                const parsedData = JSON.parse(res.data.data);
                workflowOutput = parsedData;
                console.log('✅ 解析成功，workflowOutput:', workflowOutput);
                console.log('workflowOutput 字段:', Object.keys(workflowOutput));
              } catch (e) {
                console.error('❌ 解析 res.data.data 失败:', e);
                console.error('原始字符串:', res.data.data);
                workflowOutput = res.data;
              }
            } else {
              workflowOutput = res.data.data;
              console.log('📍 res.data.data 是对象:', workflowOutput);
              console.log('workflowOutput 字段:', Object.keys(workflowOutput));
            }
          } else {
            console.warn('⚠️ res.data.data 不存在，使用 res.data');
            workflowOutput = res.data;
          }
          
          console.log('\n【步骤 2】从工作流输出中提取数据...');
          console.log('workflowOutput 结构:', workflowOutput);
          

          if (workflowOutput) {
            if (workflowOutput.result) {
              console.log('📍 检测到 result 字段，类型:', typeof workflowOutput.result);
              if (typeof workflowOutput.result === 'string') {
                console.log('📍 result 是字符串，尝试解析...');
                try {
                  nutritionData = JSON.parse(workflowOutput.result);
                  console.log('✅ 解析 result 字符串成功:', nutritionData);
                } catch (e) {
                  console.error('❌ 解析 result JSON 失败:', e);
                  console.error('result 原始内容:', workflowOutput.result);
                }
              } else {
                nutritionData = workflowOutput.result;
                console.log('📍 result 是对象:', nutritionData);
              }
            }
            else if (workflowOutput.output) {
              console.log('📍 检测到 output 字段，尝试解析...');
              try {
                nutritionData = JSON.parse(workflowOutput.output);
                console.log('✅ 从 output 字段提取数据:', nutritionData);
                console.log('nutritionData 字段:', Object.keys(nutritionData));
              } catch (e) {
                console.error('❌ 解析 output JSON 失败:', e);
                console.error('output 原始内容:', workflowOutput.output);
              }
            }
            else if (workflowOutput.data) {
              console.log('📍 检测到 data 字段...');
              nutritionData = workflowOutput.data;
              console.log('从 data 字段提取数据:', nutritionData);
            }
          }
          
          console.log('\n【步骤 3】验证数据有效性...');
          console.log('nutritionData:', nutritionData);
          console.log('calories 类型:', typeof nutritionData?.calories);
          console.log('calories 值:', nutritionData?.calories);
          
          if (nutritionData && typeof nutritionData.calories === 'number') {
            console.log('✅ 数据验证通过，识别成功!');
            const result = {
              name: nutritionData.name || foodText,
              calories: nutritionData.calories,
              protein: nutritionData.protein || 0,
              carb: nutritionData.carb || 0,
              fat: nutritionData.fat || 0,
              portion: nutritionData.portion || '1 份',
              grams: nutritionData.grams || 100,
              confidence: nutritionData.confidence || 0.5
            };
            console.log('📍 最终提取结果:', result);
            console.log('='.repeat(60));
            console.log('【食物识别工作流】调用完成 ✅');
            console.log('='.repeat(60));
            console.log('\n');
            resolve(result);
          } else {
            console.warn('❌ 数据验证失败：calories 不是数字类型');
            console.warn('nutritionData:', nutritionData);
            wx.showToast({
              title: '识别结果格式错误',
              icon: 'none'
            });
            console.log('='.repeat(60));
            console.log('【食物识别工作流】调用失败 ❌');
            console.log('='.repeat(60));
            console.log('\n');
            resolve(null);
          }
        },
        fail: (err) => {
          console.log('\n');
          console.log('='.repeat(60));
          console.log('【食物识别工作流】请求失败 ❌');
          console.log('='.repeat(60));
          console.log('📍 失败时间:', new Date().toLocaleString('zh-CN'));
          console.error('错误信息:', err);
          console.error('错误详情:', err.errMsg);
          
          let errorMsg = '网络请求失败';
          if (err.errMsg && err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请检查：\n1. 工作流是否已发布\n2. WorkFlow ID 是否正确\n3. Token 是否有效';
            console.error('❌ 可能原因：请求超时');
          } else if (err.errMsg && err.errMsg.includes('401')) {
            errorMsg = 'Token 无效，请检查配置';
            console.error('❌ 可能原因：Token 无效 (401)');
          } else if (err.errMsg && err.errMsg.includes('404')) {
            errorMsg = 'WorkFlow ID 错误或工作流未发布';
            console.error('❌ 可能原因：WorkFlow ID 错误 (404)');
          } else if (err.errMsg && err.errMsg.includes('fail')) {
            errorMsg = '网络连接失败，请检查网络';
            console.error('❌ 可能原因：网络连接失败');
          }
          
          console.error('错误提示:', errorMsg);
          console.log('='.repeat(60));
          console.log('【食物识别工作流】调用终止');
          console.log('='.repeat(60));
          console.log('\n');
          
          wx.showModal({
            title: '请求失败',
            content: errorMsg,
            showCancel: false
          });
          
          resolve(null);
        }
      });
    });
  },

  async fetchCozeImageWorkflow(imageUrl) {
    try {
      const COZE_IMAGE_WORKFLOW_ID = '7xxxxxxxxxxxxxx';
      const COZE_TOKEN = 'pat_xxxxxxxxxxxxx';           
      const COZE_WORKFLOW_URL = 'https://api.coze.cn/open_api/v2/workflow/run';
      
      console.log('调用图像识别工作流，图片 URL:', imageUrl);
      
      const response = await request.post(COZE_WORKFLOW_URL, {
        workflow_id: COZE_IMAGE_WORKFLOW_ID,
        input_params: {
          image_url: imageUrl,
          image_type: 'url'
        }
      }, {
        header: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('工作流响应:', response);
      
      if (response && response.data && response.data.data) {
        const workflowOutput = response.data.data;
        const recognitionData = workflowOutput.result;
        
        if (recognitionData && typeof recognitionData.calories === 'number') {
          return {
            name: recognitionData.name || '未知食物',
            calories: recognitionData.calories,
            protein: recognitionData.protein || 0,
            carb: recognitionData.carb || 0,
            fat: recognitionData.fat || 0,
            portion: recognitionData.portion || '1 份',
            grams: recognitionData.grams || 100,
            confidence: recognitionData.confidence || 0.5,
            imageQuality: recognitionData.image_quality || 0.5,
            ingredients: recognitionData.ingredients || []
          };
        }
      }
      
      console.warn('图像工作流返回数据格式不正确');
      return null;
      
    } catch (err) {
      console.error('图像工作流调用失败:', err);
      return null;
    }
  },

  async confirmFoodInput() {
    if (!this.data.foodInput.trim()) {
      wx.showToast({ title: '请输入食物信息', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '查询中...' });
    
    try {
      const foodData = await this.fetchCozeWorkflowNutrition(this.data.foodInput);
      
      if (foodData) {
        if (foodData.confidence < 0.6) {
          wx.showModal({
            title: '提示',
            content: `识别结果置信度较低 (${(foodData.confidence * 100).toFixed(0)}%)，请确认数据是否准确`,
            showCancel: false
          });
        }
        this.showFoodConfirmPopup(foodData);
      } else {
        const mockData = {
          name: this.data.foodInput,
          calories: Math.floor(Math.random() * 100) + 50,
          protein: Math.floor(Math.random() * 10) + 1,
          carb: Math.floor(Math.random() * 20) + 5,
          fat: Math.floor(Math.random() * 8) + 1,
          portion: '1 份',
          grams: 100,
          confidence: 0.3
        };
        wx.showModal({
          title: '提示',
          content: '查询服务暂时不可用，将使用估算数据',
          showCancel: false
        });
        this.showFoodConfirmPopup(mockData);
      }
    } catch (err) {
      console.error('食物识别错误:', err);
      wx.showToast({ title: '识别失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.onCloseTextInputPopup();
    }
  },

  handleAIRecognitionResult(aiResult) {

    if (aiResult && aiResult.name) {
      this.showFoodConfirmPopup(aiResult);
    }
  }
});