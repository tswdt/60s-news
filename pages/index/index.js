Page({
  data: {
    newsData: null,
    loading: true,
    error: false,
    isPlaying: false,
    audioDuration: 0,
    currentTime: 0
  },

  audioContext: null,

  onLoad() {
    const date = this.getTodayDate();
    this.loadNewsData(date);
    this.initAudio(date);
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
    }
  },

  initAudio(date) {
    this.audioContext = wx.createInnerAudioContext();
    // 临时使用本地音频文件进行测试
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
    });
  },

  playAudio() {
    if (!this.audioContext) {
      return;
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
    this.loadNewsData(date);
  },

  getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  loadNewsData(date) {
    console.log('加载新闻数据，日期:', date);

    // 尝试从缓存加载
    try {
      const cachedData = wx.getStorageSync(`news_${date}`);
      if (cachedData && cachedData.image) {
        console.log('从缓存加载数据成功');
        this.setData({
          newsData: cachedData,
          loading: false
        });
        return;
      }
    } catch (e) {
      console.log('缓存读取失败');
    }

    // 使用 API 获取数据
    wx.request({
      url: `https://60s.viki.moe/v2/60s`,
      method: 'GET',
      timeout: 30000,
      success: (res) => {
        console.log('API 请求成功:', res.statusCode);
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          // 构建新闻数据
          const newsData = {
            date: date,
            image: data.data?.image || `https://60s-static.viki.moe/60s/${date}.png`,
            news: data.data?.news || []
          };

          this.setData({
            newsData: newsData,
            loading: false
          });

          // 保存到缓存
          wx.setStorageSync(`news_${date}`, newsData);
          console.log('新闻图片URL:', newsData.image);
        } else {
          // API 失败，使用默认图片URL
          this.useDefaultImage(date);
        }
      },
      fail: (err) => {
        console.error('API 请求失败:', err);
        // 使用默认图片URL
        this.useDefaultImage(date);
      }
    });
  },

  useDefaultImage(date) {
    const imageUrl = `https://60s-static.viki.moe/60s/${date}.png`;
    const newsData = {
      date: date,
      image: imageUrl
    };

    this.setData({
      newsData: newsData,
      loading: false
    });

    wx.setStorageSync(`news_${date}`, newsData);
    console.log('使用默认图片URL:', imageUrl);
  },

  handleRetry() {
    const date = this.getTodayDate();
    this.loadNewsData(date);
  }
})
