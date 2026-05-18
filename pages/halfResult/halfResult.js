function generateRoomId() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  var id = ''
  for (var i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

Page({
  data: {
    featureCount: 3,
    topFeature: null,
    roomId: ''
  },

  onLoad: function(options) {
    var selfResult = wx.getStorageSync('selfResult')
    var features = []
    var featureCount = 3

    if (selfResult && selfResult.oldScore !== undefined) {
      if (selfResult.topFeatures && selfResult.topFeatures.length > 0) {
        features = selfResult.topFeatures
      } else if (selfResult.dimensionResult) {
        features = this.extractTopFeatures(selfResult.dimensionResult)
      }
      featureCount = features.length || 3
    } else {
      var percentage = 63
      if (options && options.percentage) {
        percentage = parseInt(options.percentage) || 63
      }
      features = this.getDefaultFeatures(percentage)
      featureCount = features.length
    }

    if (features.length === 0) {
      features = this.getDefaultFeatures(63)
      featureCount = features.length
    }

    var topFeature = features.length > 0 ? features[0] : null

    var roomId = wx.getStorageSync('currentRoomId')
    if (!roomId) {
      roomId = generateRoomId()
      wx.setStorageSync('currentRoomId', roomId)
    }

    this.setData({
      featureCount: featureCount,
      topFeature: topFeature,
      roomId: roomId
    })
  },

  extractTopFeatures: function(dimensionResult) {
    var arr = []
    var keys = Object.keys(dimensionResult)
    for (var i = 0; i < keys.length; i++) {
      arr.push(dimensionResult[keys[i]])
    }
    arr.sort(function(a, b) { return b.percent - a.percent })
    return arr.slice(0, 3)
  },

  getDefaultFeatures: function(percentage) {
    var factor = percentage / 100
    return [
      { name: '指挥感', icon: '/assets/icons/megaphone.png', bgColor: '#E3F2FD', color: '#2196F3', percent: Math.min(100, Math.round(70 * factor)), level: factor > 0.6 ? '偏高' : '中等' },
      { name: '资历感', icon: '/assets/icons/medal.png', bgColor: '#E8F5E9', color: '#4CAF50', percent: Math.min(100, Math.round(60 * factor)), level: factor > 0.5 ? '明显' : '中等' },
      { name: '懂王感', icon: '/assets/icons/crown.png', bgColor: '#FFF8E1', color: '#F5A623', percent: Math.min(100, Math.round(45 * factor)), level: factor > 0.7 ? '偏高' : '偏低' }
    ]
  },

  onInviteFriend: function() {
    var roomId = this.data.roomId
    wx.setStorageSync('currentRoomId', roomId)
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    wx.showToast({
      title: '点击右上角分享给好友',
      icon: 'none',
      duration: 2000
    })
  },

  onViewBrief: function() {
    wx.showModal({
      title: '简版提示',
      content: '你目前不像完全没事，但还不能定案。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#FF7A45'
    })
  },

  onShareAppMessage: function() {
    var roomId = this.data.roomId
    return {
      title: '系统说我俩之间必有一个老登，我不服，你来。',
      path: '/pages/friendEntry/friendEntry?roomId=' + roomId
    }
  }
})
