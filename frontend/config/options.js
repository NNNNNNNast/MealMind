export const genderOptions = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
  { label: '未知', value: 0 }
];

export const dietOptions = [
  { text: '普通饮食', value: '普通饮食' },
  { text: '素食', value: '素食' },
  { text: '低脂饮食', value: '低脂饮食' },
  { text: '低碳饮食', value: '低碳饮食' },
  { text: '高蛋白饮食', value: '高蛋白饮食' }
];

export const tasteOptions = [
  { label: '清淡', value: '清淡' },
  { label: '咸香', value: '咸香' },
  { label: '麻辣', value: '麻辣' },
  { label: '酸甜', value: '酸甜' },
  { label: '酸辣', value: '酸辣' },
  { label: '原味', value: '原味' }
];

export const nutritionConfig = {
  kcal: {
    max: 1800,
    unit: 'kcal',
    step: 50
  },
  protein: {
    max: 60,
    unit: 'g',
    step: 5
  },
  carb: {
    max: 200,
    unit: 'g',
    step: 10
  },
  fat: {
    max: 60,
    unit: 'g',
    step: 5
  }
};

export const gradientColors = {
  '0%': '#ffd01e',
  '100%': '#ee0a24'
};

export const defaultFormData = {
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
  fastingGlucose: '',
  nutritionGoal: ''
};
