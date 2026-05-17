var MOCK_THREE_RESULTS = [
  {
    name: '张三',
    percentage: 82,
    dimensionResult: {
      elder: { percent: 70 },
      pose: { percent: 55 },
      knowitall: { percent: 65 },
      awkward: { percent: 40 },
      seniority: { percent: 88 },
      command: { percent: 72 }
    }
  },
  {
    name: '李四',
    percentage: 68,
    dimensionResult: {
      elder: { percent: 50 },
      pose: { percent: 60 },
      knowitall: { percent: 85 },
      awkward: { percent: 35 },
      seniority: { percent: 45 },
      command: { percent: 55 }
    }
  },
  {
    name: '王五',
    percentage: 55,
    dimensionResult: {
      elder: { percent: 40 },
      pose: { percent: 50 },
      knowitall: { percent: 45 },
      awkward: { percent: 60 },
      seniority: { percent: 35 },
      command: { percent: 78 }
    }
  }
]

var IDENTITY_MAP = {
  elder: { identity: '长辈担当', feature: '长辈感高' },
  pose: { identity: '端着担当', feature: '端着感高' },
  knowitall: { identity: '懂王担当', feature: '懂王感高' },
  awkward: { identity: '冷场担当', feature: '冷场感高' },
  seniority: { identity: '资历担当', feature: '资历感高' },
  command: { identity: '指挥担当', feature: '指挥感高' }
}

function getTopDimension(dimensionResult) {
  if (!dimensionResult) return { key: 'knowitall', percent: 0 }
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
  return { key: maxKey, percent: max }
}

function assignIdentities(players) {
  var usedDimensions = {}
  var results = []

  for (var i = 0; i < players.length; i++) {
    var p = players[i]
    var topDim = getTopDimension(p.dimensionResult)
    var dimKey = topDim.key

    if (usedDimensions[dimKey]) {
      var keys = Object.keys(IDENTITY_MAP)
      for (var j = 0; j < keys.length; j++) {
        if (!usedDimensions[keys[j]]) {
          dimKey = keys[j]
          break
        }
      }
    }

    usedDimensions[dimKey] = true
    var info = IDENTITY_MAP[dimKey] || { identity: '综合担当', feature: '综合感高' }

    results.push({
      name: p.name,
      percentage: p.percentage,
      identity: i === 0 ? '本局老登' : info.identity,
      feature: info.feature,
      topDimKey: dimKey
    })
  }

  return results
}

function generateVerdict(players) {
  if (!players || players.length < 3) return '三人各显神通，各有各的老登味。'

  var identities = []
  for (var i = 0; i < players.length; i++) {
    var p = players[i]
    if (i === 0) {
      identities.push('一个爱点评')
    } else if (p.topDimKey === 'command') {
      identities.push('一个爱安排')
    } else if (p.topDimKey === 'knowitall') {
      identities.push('一个爱说教')
    } else if (p.topDimKey === 'seniority') {
      identities.push('一个爱摆资历')
    } else if (p.topDimKey === 'elder') {
      identities.push('一个爱操心')
    } else if (p.topDimKey === 'awkward') {
      identities.push('一个爱冷场')
    } else if (p.topDimKey === 'pose') {
      identities.push('一个爱端着')
    } else {
      identities.push('一个不服')
    }
  }

  if (identities.length >= 3) {
    identities[identities.length - 1] = identities[identities.length - 1].replace('一个', '一个负责')
  }

  return identities.join('，') + '。'
}

Page({
  data: {
    players: [],
    verdict: ''
  },

  onLoad: function(options) {
    var threeResults = wx.getStorageSync('threeResults')

    if (!threeResults || !threeResults.length) {
      threeResults = MOCK_THREE_RESULTS
    }

    threeResults.sort(function(a, b) { return b.percentage - a.percentage })

    var players = assignIdentities(threeResults)
    var verdict = generateVerdict(players)

    this.setData({
      players: players,
      verdict: verdict
    })
  },

  onGenerateImage: function() {
    wx.navigateTo({
      url: '/pages/sharePoster/sharePoster?type=three'
    })
  },

  onRestart: function() {
    wx.reLaunch({
      url: '/pages/home/home'
    })
  },

  onShareAppMessage: function() {
    var names = ''
    for (var i = 0; i < this.data.players.length; i++) {
      if (i > 0) names += '、'
      names += this.data.players[i].name
    }
    return {
      title: names + ' 的三人老登局结果出炉！你也来试试？',
      path: '/pages/home/home'
    }
  }
})
