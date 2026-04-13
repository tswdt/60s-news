Page({
  data: {
    newsData: null,
    loading: true,
    error: false
  },

  onLoad(options) {
    const date = options.date || this.getTodayDate();
    this.fetchNewsData(date);
  },

  getTodayDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async fetchNewsData(date) {
    this.setData({ loading: true, error: false });
    
    try {
      // 先尝试从本地缓存获取
      const cachedData = wx.getStorageSync(`news_${date}`);
      if (cachedData) {
        this.setData({
          newsData: cachedData,
          loading: false
        });
      }
      
      // 使用普通网络请求获取数据
      const response = await wx.request({
        url: `https://60s-static.viki.moe/60s/${date}.json`,
        method: 'GET',
        timeout: 10000
      });
      
      if (response.statusCode === 200 && response.data) {
        this.setData({
          newsData: response.data,
          loading: false
        });
      } else {
        console.error('获取新闻数据失败:', response.statusCode);
        if (!this.data.newsData) {
          this.setData({ loading: false, error: true });
        }
      }
    } catch (error) {
      console.error('网络请求失败:', error);
      if (!this.data.newsData) {
        this.setData({ loading: false, error: true });
      }
    }
  },

  handleRetry() {
    const date = this.data.newsData?.date || this.getTodayDate();
    this.fetchNewsData(date);
  }
})