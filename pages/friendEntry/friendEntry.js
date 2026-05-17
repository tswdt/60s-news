Page({
  data: {
    roomId: '',
    errorState: false,
    dimensions: [
      { key: 'elder', name: '长辈感', iconPath: '/assets/icons/elder.png' },
      { key: 'pose', name: '端着感', iconPath: '/assets/icons/tea.png' },
      { key: 'knowitall', name: '懂王感', iconPath: '/assets/icons/crown.png' },
      { key: 'awkward', name: '冷场感', iconPath: '/assets/icons/mic.png' },
      { key: 'seniority', name: '资历感', iconPath: '/assets/icons/medal.png' },
      { key: 'command', name: '指挥感', iconPath: '/assets/icons/megaphone.png' }
    ]
  },

  onLoad: function(options) {
    var roomId = options.roomId || ''

    if (!roomId) {
      this.setData({ errorState: true })
      return
    }

    wx.setStorageSync('currentRoomId', roomId)
    this.setData({
      roomId: roomId,
      errorState: false
    })
  },

  onStartChallenge: function() {
    wx.navigateTo({
      url: '/pages/quiz/quiz?mode=friend&roomId=' + this.data.roomId
    })
  },

  onGoHome: function() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  },

  onShareAppMessage: function() {
    return {
      title: '系统说我俩之间必有一个老登，我不服，你来。',
      path: '/pages/friendEntry/friendEntry?roomId=' + this.data.roomId
    }
  }
})
