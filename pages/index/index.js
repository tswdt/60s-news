Page({
  data: {
    currentDate: '',
    newsData: null,
    loading: true,
    error: false
  },

  onLoad() {
    const date = this.getTodayDate();
    this.setData({
      currentDate: date
    });
    this.loadLocalData(date);
  },

  onPullDownRefresh() {
    const date = this.getTodayDate();
    this.setData({
      currentDate: date
    });
    this.fetchNewsData(date);
  },

  getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  loadLocalData(date) {
    console.log('尝试加载本地数据，日期:', date);
    try {
      const cachedData = wx.getStorageSync(`news_${date}`);
      if (cachedData) {
        console.log('从缓存加载数据成功');
        this.setData({
          newsData: cachedData,
          loading: false
        });
        return;
      }

      wx.request({
        url: `https://60s-static.viki.moe/60s/${date}.json`,
        method: 'GET',
        timeout: 30000,
        success: (res) => {
          console.log('网络请求成功:', res.statusCode);
          if (res.statusCode === 200 && res.data) {
            this.setData({
              newsData: res.data,
              loading: false
            });
            wx.setStorageSync(`news_${date}`, res.data);
          }
        },
        fail: (err) => {
          console.error('网络请求失败:', err);
          this.setData({ loading: false, error: true });
        }
      });
    } catch (error) {
      console.error('加载失败:', error);
      this.setData({ loading: false, error: true });
    }
  },

  async fetchNewsData(date) {
    this.setData({ loading: true, error: false });
    
    try {
      const response = await wx.request({
        url: `https://60s-static.viki.moe/60s/${date}.json`,
        method: 'GET',
        timeout: 30000
      });
      
      if (response && response.statusCode === 200 && response.data) {
        this.setData({
          newsData: response.data,
          loading: false
        });
        wx.setStorageSync(`news_${date}`, response.data);
      } else {
        this.setData({ loading: false, error: true });
      }
    } catch (error) {
      console.error('网络请求失败:', error);
      this.setData({ loading: false, error: true });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  handleRetry() {
    const date = this.data.currentDate || this.getTodayDate();
    this.fetchNewsData(date);
  },

  navigateToDetail() {
    const date = this.data.currentDate;
    wx.navigateTo({
      url: `/pages/detail/detail?date=${date}`
    });
  }
})