var HEADLINES = [
  '系统说我俩之间必有一个老登',
  '我测出老登味了，但我怀疑你更严重',
  '谁才是本局老登？不服来测'
]

var TYPE_MAP = {
  elder: '长辈型',
  pose: '端着型',
  knowitall: '懂王型',
  awkward: '冷场型',
  seniority: '资历型',
  command: '指挥型'
}

function getTypeLabel(dimensionResult) {
  if (!dimensionResult) return '潜力老登'
  var max = 0
  var maxKey = ''
  var keys = Object.keys(dimensionResult)
  for (var i = 0; i < keys.length; i++) {
    var d = dimensionResult[keys[i]]
    if (d && d.percent > max) {
      max = d.percent
      maxKey = keys[i]
    }
  }
  return TYPE_MAP[maxKey] || '潜力老登'
}

function getLevelLabel(percentage) {
  if (percentage >= 80) return '资深老登'
  if (percentage >= 60) return '潜力老登'
  if (percentage >= 40) return '萌新选手'
  return '反骨仔'
}

function getVerdict(selfScore, friendScore) {
  if (friendScore > selfScore) {
    return '胜负已分！老登之王就是 TA！'
  } else if (selfScore > friendScore) {
    return '胜负已分！老登之王就是你！'
  }
  return '势均力敌！你俩都是老登！'
}

Page({
  data: {
    headline: '',
    selfScore: 0,
    selfLevel: '',
    friendScore: 0,
    friendLevel: '',
    verdict: '',
    headlineIndex: 0
  },

  onLoad: function(options) {
    var selfResult = wx.getStorageSync('selfResult')
    var friendResult = wx.getStorageSync('friendResult')

    var selfPct = (selfResult && selfResult.percentage) || 78
    var friendPct = (friendResult && friendResult.percentage) || 92

    var selfLevel = (selfResult && getTypeLabel(selfResult.dimensionResult)) || getLevelLabel(selfPct)
    var friendLevel = (friendResult && getTypeLabel(friendResult.dimensionResult)) || getLevelLabel(friendPct)

    var headlineIndex = Math.floor(Math.random() * HEADLINES.length)

    this.setData({
      headline: HEADLINES[headlineIndex],
      headlineIndex: headlineIndex,
      selfScore: selfPct,
      selfLevel: selfLevel,
      friendScore: friendPct,
      friendLevel: friendLevel,
      verdict: getVerdict(selfPct, friendPct)
    })
  },

  onSavePoster: function() {
    wx.showToast({
      title: '海报生成功能开发中',
      icon: 'none'
    })
  },

  onShare: function() {
    wx.showShareMenu({ withShareTicket: true })
  },

  onChangeHeadline: function() {
    var currentIndex = this.data.headlineIndex
    var nextIndex = (currentIndex + 1) % HEADLINES.length
    this.setData({
      headline: HEADLINES[nextIndex],
      headlineIndex: nextIndex
    })
  },

  onShareAppMessage: function() {
    return {
      title: this.data.headline,
      path: '/pages/home/home'
    }
  }
})
