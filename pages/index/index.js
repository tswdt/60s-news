Page({
  data: {
    newsData: null,
    loading: true,
    error: false,
    isPlaying: false,
    audioDuration: 0,
    currentTime: 0,
    currentDay: '',
    currentMonth: '',
    backgroundImage: ''
  },

  audioContext: null,

  landscapeImages: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800'
  ],

  onLoad() {
    const date = this.getTodayDate();
    this.setDateDisplay();
    this.setBackgroundImage(date);
    this.loadNewsData(date);
    this.initAudio(date);
  },

  setBackgroundImage(date) {
    const hash = this.hashString(date);
    const index = hash % this.landscapeImages.length;
    const imageUrl = this.landscapeImages[index];
    this.setData({
      backgroundImage: imageUrl
    });
  },

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  setDateDisplay() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.setData({
      currentDay: day,
      currentMonth: month
    });
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
    }
  },

  initAudio(date) {
    console.log('初始化音频, 日期:', date);
    
    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext();
    
    // 解除静音限制
    this.audioContext.obeyMuteSwitch = false;
    this.audioContext.volume = 1.0;
    
    // 绑定事件监听器
    this.bindAudioEvents();
    
    // 优先尝试从云存储加载
    this.loadAudioFromCloud(date);
  },

  loadAudioFromCloud(date) {
    console.log('尝试从云存储加载音频...');
    
    // 尝试从小程序云存储获取
    wx.cloud.downloadFile({
      fileID: `cloud://w3221540766-1gipotvhc2ceb014.736f-w3221540766-1gipotvhc2ceb014-1250000000/audio/${date}.mp3`,
      success: (res) => {
        console.log('从云存储获取音频成功:', res.tempFilePath);
        this.audioContext.src = res.tempFilePath;
      },
      fail: (err) => {
        console.log('云存储获取失败:', err);
        // 如果云存储没有，尝试网络音频源
        this.tryLoadAudioFromNetwork(date, 0);
      }
    });
  },

  audioSources: [
    (date, timestamp) => `https://cdn.jsdelivr.net/gh/tswdt/60s-news@main/audio/${date}.mp3?t=${timestamp}`,
    (date, timestamp) => `https://raw.githubusercontent.com/tswdt/60s-news/main/audio/${date}.mp3?t=${timestamp}`,
    (date, timestamp) => `https://cdn.statically.io/gh/tswdt/60s-news/main/audio/${date}.mp3?t=${timestamp}`
  ],

  currentAudioSourceIndex: 0,

  tryLoadAudioFromNetwork(date, sourceIndex) {
    if (sourceIndex >= this.audioSources.length) {
      console.error('所有音频源都失败了');
      wx.showToast({
        title: '音频暂不可用，请检查网络或联系管理员',
        icon: 'none',
        duration: 3000
      });
      return;
    }

    const timestamp = Date.now();
    const audioUrl = this.audioSources[sourceIndex](date, timestamp);
    console.log(`尝试网络音频源 ${sourceIndex + 1}/${this.audioSources.length}:`, audioUrl);
    
    this.currentAudioSourceIndex = sourceIndex;
    this.audioContext.src = audioUrl;
  },

  bindAudioEvents() {
    // 音频可以播放时
    this.audioContext.onCanplay(() => {
      console.log('音频可以播放');
      setTimeout(() => {
        const duration = this.audioContext.duration;
        console.log('音频时长:', duration);
        this.setData({
          audioDuration: duration || 0
        });
      }, 500);
    });

    // 开始播放
    this.audioContext.onPlay(() => {
      console.log('开始播放');
      this.setData({ isPlaying: true });
    });

    // 暂停播放
    this.audioContext.onPause(() => {
      console.log('暂停播放');
      this.setData({ isPlaying: false });
    });

    // 停止播放
    this.audioContext.onStop(() => {
      console.log('停止播放');
      this.setData({ isPlaying: false, currentTime: 0 });
    });

    // 播放结束
    this.audioContext.onEnded(() => {
      console.log('播放结束');
      this.setData({ isPlaying: false, currentTime: 0 });
    });

    // 播放进度更新
    this.audioContext.onTimeUpdate(() => {
      this.setData({
        currentTime: this.audioContext.currentTime
      });
    });

    // 播放错误
    this.audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      
      // 尝试下一个音频源
      const date = this.getTodayDate();
      const nextIndex = this.currentAudioSourceIndex + 1;
      if (nextIndex < this.audioSources.length) {
        console.log(`音频源 ${this.currentAudioSourceIndex + 1} 失败，尝试下一个...`);
        this.tryLoadAudioFromNetwork(date, nextIndex);
      } else {
        wx.showToast({
          title: '音频加载失败，请检查网络',
          icon: 'none',
          duration: 3000
        });
      }
    });

    // 加载中
    this.audioContext.onWaiting(() => {
      console.log('音频加载中...');
    });
  },

  playAudio() {
    console.log('点击播放按钮, 当前状态:', this.data.isPlaying);
    
    if (!this.audioContext) {
      console.log('audioContext 不存在');
      return;
    }

    if (this.data.isPlaying) {
      console.log('执行暂停');
      this.audioContext.pause();
    } else {
      console.log('执行播放');
      this.audioContext.play();
    }
  },

  seekAudio(e) {
    const position = e.detail.value;
    console.log('拖动到位置:', position);
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

    // 先清除旧缓存
    try {
      wx.removeStorageSync(`news_${date}`);
      console.log('旧缓存已清除');
    } catch (e) {
      console.log('清除缓存失败');
    }

    // 使用 API 获取数据
    wx.request({
      url: `https://60s.viki.moe/v2/60s`,
      method: 'GET',
      timeout: 30000,
      success: (res) => {
        console.log('API 请求成功:', res.statusCode);
        console.log('API 返回数据:', JSON.stringify(res.data));
        
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          
          let imageUrl = '';
          if (data.data?.image) {
            imageUrl = data.data.image;
          } else if (data.image) {
            imageUrl = data.image;
          }
          
          console.log('提取到的图片URL:', imageUrl);
          
          const newsData = {
            date: date,
            image: imageUrl || `https://60s-static.viki.moe/60s/${date}.png`,
            news: data.data?.news || data.news || []
          };

          this.setData({
            newsData: newsData,
            loading: false
          });

          wx.setStorageSync(`news_${date}`, newsData);
          console.log('最终使用的图片URL:', newsData.image);
        } else {
          console.log('API返回数据格式不对');
          this.useDefaultImage(date);
        }
      },
      fail: (err) => {
        console.error('API 请求失败:', err);
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
  },

  handleImageError(e) {
    console.error('图片加载失败:', e);
    const date = this.getTodayDate();
    const fallbackImageUrl = `https://60s-static.viki.moe/60s/${date}.png?t=${Date.now()}`;
    console.log('尝试使用备用图片:', fallbackImageUrl);
    this.setData({
      'newsData.image': fallbackImageUrl
    });
  },

  clearCacheAndReload() {
    const date = this.getTodayDate();
    try {
      wx.removeStorageSync(`news_${date}`);
      console.log('缓存已清除');
    } catch (e) {
      console.error('清除缓存失败:', e);
    }
    this.setData({
      loading: true,
      error: false
    });
    this.loadNewsData(date);
  }
})
