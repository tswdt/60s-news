var MOCK_FRIEND_RESULT = {
  oldScore: 82,
  percentage: 82,
  level: '资深老登',
  levelDesc: '老登气质已经相当明显了',
  dimensionResult: {
    elder: { key: 'elder', name: '长辈感', icon: '/assets/icons/elder.png', color: '#FF7A45', bgColor: '#FFF0E6', percent: 85, level: '偏高' },
    pose: { key: 'pose', name: '端着感', icon: '/assets/icons/tea.png', color: '#5B9BD5', bgColor: '#E8F4FD', percent: 60, level: '明显' },
    knowitall: { key: 'knowitall', name: '懂王感', icon: '/assets/icons/crown.png', color: '#F5A623', bgColor: '#FFF8E1', percent: 90, level: '偏高' },
    awkward: { key: 'awkward', name: '冷场感', icon: '/assets/icons/mic.png', color: '#9B59B6', bgColor: '#F3E8FF', percent: 45, level: '中等' },
    seniority: { key: 'seniority', name: '资历感', icon: '/assets/icons/medal.png', color: '#4CAF50', bgColor: '#E8F5E9', percent: 75, level: '偏高' },
    command: { key: 'command', name: '指挥感', icon: '/assets/icons/megaphone.png', color: '#2196F3', bgColor: '#E3F2FD', percent: 88, level: '偏高' }
  },
  topFeatures: [
    { name: '懂王感', icon: '/assets/icons/crown.png', color: '#F5A623', bgColor: '#FFF8E1', percent: 90, level: '偏高' },
    { name: '指挥感', icon: '/assets/icons/megaphone.png', color: '#2196F3', bgColor: '#E3F2FD', percent: 88, level: '偏高' },
    { name: '长辈感', icon: '/assets/icons/elder.png', color: '#FF7A45', bgColor: '#FFF0E6', percent: 85, level: '偏高' }
  ]
}

function getLevel(percentage) {
  if (percentage >= 80) return '传说级老登'
  if (percentage >= 60) return '资深老登'
  if (percentage >= 40) return '潜力型老登'
  if (percentage >= 20) return '萌新选手'
  return '反骨仔'
}

function getTypeLabel(dimensionResult) {
  if (!dimensionResult) return '综合型'
  var max = 0
  var maxKey = ''
  var keys = Object.keys(dimensionResult)
  for (var i = 0; i < keys.length; i++) {
    var d = dimensionResult[keys[i]]
    if (d.percent > max) {
      max = d.percent
      maxKey = keys[i]
    }
  }
  var map = {
    elder: '长辈型',
    pose: '端着型',
    knowitall: '懂王型',
    awkward: '冷场型',
    seniority: '资历型',
    command: '指挥型'
  }
  return map[maxKey] || '综合型'
}

function extractFeatures(dimensionResult) {
  if (!dimensionResult) return []
  var arr = []
  var keys = Object.keys(dimensionResult)
  for (var i = 0; i < keys.length; i++) {
    var d = dimensionResult[keys[i]]
    var levelText = d.percent >= 70 ? '强' : (d.percent >= 40 ? '明显' : '中等')
    arr.push({
      icon: d.icon,
      text: d.name + levelText,
      bgColor: d.bgColor
    })
  }
  arr.sort(function(a, b) {
    return b.percent - a.percent
  })
  return arr.slice(0, 3)
}

function getVerdict(selfIsWinner, selfPct, friendPct) {
  if (selfIsWinner) {
    if (selfPct - friendPct >= 20) return '你以压倒性优势成为本局老登，这味儿太冲了！'
    if (selfPct - friendPct >= 10) return '恭喜你，本局老登就是你了，实至名归。'
    return '险胜！你只是比TA更像老登那么一点点。'
  } else {
    if (friendPct - selfPct >= 20) return '你也别太得意，TA 只是更像本局老登。'
    if (friendPct - selfPct >= 10) return '你也别太得意，TA 只是更像本局老登。'
    return '险败！你离老登只差一步之遥。'
  }
}

Page({
  data: {
    playerA: { name: '你', percentage: 0, level: '', isWinner: false, isSelf: true },
    playerB: { name: 'TA', percentage: 0, level: '', isWinner: false, isSelf: false },
    winnerLabel: '',
    winnerFeatures: [],
    verdict: '',
    roomId: ''
  },

  onLoad: function(options) {
    var selfResult = wx.getStorageSync('selfResult')
    var friendResult = wx.getStorageSync('friendResult')

    if (!friendResult) {
      friendResult = MOCK_FRIEND_RESULT
    }

    var selfPct = 63
    var selfLevel = '潜力型老登'
    var selfDimResult = null
    if (selfResult && selfResult.oldScore !== undefined) {
      selfPct = selfResult.percentage || selfResult.oldScore
      selfLevel = selfResult.level || getLevel(selfPct)
      selfDimResult = selfResult.dimensionResult || null
    }

    var friendPct = friendResult.percentage || friendResult.oldScore || 82
    var friendLevel = friendResult.level || getLevel(friendPct)
    var friendDimResult = friendResult.dimensionResult || null

    var selfIsWinner = selfPct >= friendPct
    var winnerLabel = selfIsWinner ? '你' : 'TA'
    var winnerDimResult = selfIsWinner ? selfDimResult : friendDimResult
    var winnerFeatures = extractFeatures(winnerDimResult)
    var verdict = getVerdict(selfIsWinner, selfPct, friendPct)

    var selfType = getTypeLabel(selfDimResult)
    var friendType = getTypeLabel(friendDimResult)

    var roomId = wx.getStorageSync('currentRoomId') || ''

    this.setData({
      playerA: {
        name: '你',
        percentage: selfPct,
        level: selfType,
        isWinner: selfIsWinner,
        isSelf: true
      },
      playerB: {
        name: 'TA',
        percentage: friendPct,
        level: friendType,
        isWinner: !selfIsWinner,
        isSelf: false
      },
      winnerLabel: winnerLabel,
      winnerFeatures: winnerFeatures,
      verdict: verdict,
      roomId: roomId
    })
  },

  onInviteAnother: function() {
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

  onGenerateImage: function() {
    wx.navigateTo({
      url: '/pages/sharePoster/sharePoster'
    })
  },

  onRestart: function() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  },

  onShareAppMessage: function() {
    var roomId = this.data.roomId
    var path = '/pages/home/home'
    if (roomId) {
      path = '/pages/friendEntry/friendEntry?roomId=' + roomId
    }
    return {
      title: '本局老登还没定，差你一个。',
      path: path
    }
  }
})
