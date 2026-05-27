// utils/request.js
const baseUrl = 'http://localhost:8081';
const Auth = require('./auth');

function request(options) {
  return new Promise((resolve, reject) => {
    const token = Auth.getToken();
    
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    };
    
    if (token) {
      header['satoken'] = token;
    }
    
    const fullUrl = options.url.startsWith('http') 
      ? options.url 
      : `${baseUrl}${options.url}`;
    
    wx.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      timeout: options.timeout || 10000,
      success: (res) => {
        console.log('请求成功:', options.url, res.data);
        
        const responseData = res.data;
        
        if (responseData && typeof responseData === 'object' && 'code' in responseData) {
          if (responseData.code === 401) {
            Auth.removeToken();
            wx.showToast({ title: responseData.msg || '请重新登录', icon: 'none' });
            setTimeout(() => {
              wx.reLaunch({ url: '/pages/login/login' });
            }, 1500);
            reject(responseData);
          } else {
            resolve(responseData);
          }
        } else {
          console.error('后端返回格式不规范:', options.url, responseData);
          wx.showToast({ 
            title: '接口格式错误，请联系开发人员', 
            icon: 'none',
            duration: 3000
          });
          reject({ code: -1, msg: '格式错误', data: responseData });
        }
      },
      fail: (err) => {
        console.error('请求失败:', options.url, err);
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      }
    });
  });
}

const get = (url, data, options = {}) => {
  return request({ ...options, url, method: 'GET', data });
};

const post = (url, data, options = {}) => {
  return request({ ...options, url, method: 'POST', data });
};

const put = (url, data, options = {}) => {
  return request({ ...options, url, method: 'PUT', data });
};

const del = (url, data, options = {}) => {
  return request({ ...options, url, method: 'DELETE', data });
};

module.exports = {
  request,
  get,
  post,
  put,
  delete: del
};