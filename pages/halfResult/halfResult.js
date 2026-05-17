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
    percentage: 63,
    level: '潜力型老登',
    levelDesc: '',
    levelEmoji: '🎯',
    ringRotate: 0,
    features: [],
    roomId: ''
  },

  onLoad: function(options) {
    var selfResult = wx.getStorageSync('selfResult')
    var percentage = 63
    var level = '潜力型老登'
    var levelDesc = ''
    var features = []

    if (selfResult && selfResult.oldScore !== undefined) {
      percentage = selfResult.percentage || selfResult.oldScore
      level = selfResult.level || '潜力型老登'
      levelDesc = selfResult.levelDesc || ''
      if (selfResult.topFeatures && selfResult.topFeatures.length > 0) {
        features = selfResult.topFeatures
      } else if (selfResult.dimensionResult) {
        features = this.extractTopFeatures(selfResult.dimensionResult)
      }
    } else {
      if (options && options.percentage) {
        percentage = parseInt(options.percentage) || 63
      }
      if (options && options.level) {
        level = options.level
      }
      if (options && options.levelDesc) {
        levelDesc = options.levelDesc
      }
    }

    if (features.length === 0) {
      features = this.getDefaultFeatures(percentage)
    }

    var ringRotate = Math.round((percentage / 100) * 360)
    var levelEmoji = this.getLevelEmoji(percentage)

    var roomId = wx.getStorageSync('currentRoomId')
    if (!roomId) {
      roomId = generateRoomId()
      wx.setStorageSync('currentRoomId', roomId)
    }

    this.setData({
      percentage: percentage,
      level: level,
      levelDesc: levelDesc,
      levelEmoji: levelEmoji,
      ringRotate: ringRotate,
      features: features,
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

  getLevelEmoji: function(percentage) {
    if (percentage >= 80) return '👑'
    if (percentage >= 60) return '🏅'
    if (percentage >= 40) return '🎯'
    if (percentage >= 20) return '🌱'
    return '✨'
  },

  getDefaultFeatures: function(percentage) {
    var factor = percentage / 100
    return [
      { name: '指挥感', icon: '📢', bgColor: '#E3F2FD', color: '#2196F3', percent: Math.min(100, Math.round(70 * factor)), level: factor > 0.6 ? '偏高' : '中等' },
      { name: '资历感', icon: '🏅', bgColor: '#E8F5E9', color: '#4CAF50', percent: Math.min(100, Math.round(60 * factor)), level: factor > 0.5 ? '明显' : '中等' },
      { name: '懂王感', icon: '👑', bgColor: '#FFF8E1', color: '#F5A623', percent: Math.min(100, Math.round(45 * factor)), level: factor > 0.7 ? '偏高' : '偏低' }
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
    wx.showToast({
      title: '简版结果已展示',
      icon: 'none'
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
