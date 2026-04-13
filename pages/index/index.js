Page({
  data: {
    currentTimeStr: '',
    newsData: null,
    loading: true,
    error: false,
    isPlaying: false,
    audioDuration: 0,
    currentTime: 0
  },

  audioContext: null,
  timeTimer: null,

  onLoad() {
    const date = this.getTodayDate();
    this.setData({
      currentTimeStr: this.getCurrentTimeStr()
    });
    this.loadLocalData(date);
    this.initAudio();
    this.startTimeUpdate();
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
    }
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
    }
  },

  startTimeUpdate() {
    this.timeTimer = setInterval(() => {
      this.setData({
        currentTimeStr: this.getCurrentTimeStr()
      });
    }, 1000);
  },

  getCurrentTimeStr() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  initAudio() {
    this.audioContext = wx.createInnerAudioContext();
    const date = this.data.newsData ? this.data.newsData.date : this.getTodayDate();
    const audioUrl = `https://cdn.jsdelivr.net/gh/tswdt/60s-news@main/audio/${date}.mp3`;

    this.audioContext.src = audioUrl;

    this.audioContext.onCanplay(() => {
      console.log('音频可以播放');
      this.setData({
        audioDuration: this.audioContext.duration
      });
    });

    this.audioContext.onPlay(() => {
      console.log('开始播放');
      this.setData({ isPlaying: true });
    });

    this.audioContext.onPause(() => {
      console.log('暂停播放');
      this.setData({ isPlaying: false });
    });

    this.audioContext.onStop(() => {
      console.log('停止播放');
      this.setData({ isPlaying: false, currentTime: 0 });
    });

    this.audioContext.onEnded(() => {
      console.log('播放结束');
      this.setData({ isPlaying: false, currentTime: 0 });
    });

    this.audioContext.onTimeUpdate(() => {
      this.setData({
        currentTime: this.audioContext.currentTime
      });
    });

    this.audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      wx.showToast({
        title: '音频加载失败',
        icon: 'none'
      });
    });
  },

  playAudio() {
    if (!this.audioContext) {
      this.initAudio();
    }

    if (this.data.isPlaying) {
      this.audioContext.pause();
    } else {
      this.audioContext.play();
    }
  },

  seekAudio(e) {
    const position = e.detail.value;
    if (this.audioContext) {
      this.audioContext.seek(position);
    }
  },

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  onPullDownRefresh() {
    const date = this.getTodayDate();
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
    const date = this.data.newsData ? this.data.newsData.date : this.getTodayDate();
    this.fetchNewsData(date);
  },

  navigateToDetail() {
    const date = this.data.newsData ? this.data.newsData.date : this.getTodayDate();
    wx.navigateTo({
      url: `/pages/detail/detail?date=${date}`
    });
  }
})