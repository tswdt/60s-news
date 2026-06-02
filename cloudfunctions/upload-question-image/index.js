const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  return {
    success: false,
    error: 'upload-question-image 云函数尚未实现，请等待后续开发',
  };
};
