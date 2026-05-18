var mockQuestions = [
  {
    id: 1,
    dimension: 'command',
    question: '一群人出去玩，你更常扮演什么角色？',
    options: [
      { label: 'A', text: '我来安排路线和行程', score: 9 },
      { label: 'B', text: '跟着走就行，去哪都行', score: 2 },
      { label: 'C', text: '嘴上说随便，到了又挑三拣四', score: 7 },
      { label: 'D', text: '默默负责买单和善后', score: 5 }
    ]
  },
  {
    id: 2,
    dimension: 'seniority',
    question: '朋友聚会时，你总喜欢做什么？',
    options: [
      { label: 'A', text: '抢着买单，然后说"我来我来"', score: 8 },
      { label: 'B', text: '讲自己年轻时的辉煌事迹', score: 10 },
      { label: 'C', text: '对年轻人的生活方式指指点点', score: 9 },
      { label: 'D', text: '默默坐在角落刷手机', score: 3 }
    ]
  },
  {
    id: 3,
    dimension: 'knowitall',
    question: '遇到不同意见时，你的反应是？',
    options: [
      { label: 'A', text: '"我吃的盐比你吃的饭还多"', score: 10 },
      { label: 'B', text: '耐心倾听并尊重对方观点', score: 1 },
      { label: 'C', text: '直接打断，开始长篇大论', score: 9 },
      { label: 'D', text: '笑笑不说话，转移话题', score: 2 }
    ]
  },
  {
    id: 4,
    dimension: 'seniority',
    question: '对新鲜事物的态度是？',
    options: [
      { label: 'A', text: '"都是些什么乱七八糟的"', score: 9 },
      { label: 'B', text: '好奇并愿意尝试了解', score: 1 },
      { label: 'C', text: '"我们那时候可没这些"', score: 8 },
      { label: 'D', text: '嘴上嫌弃，偷偷研究', score: 5 }
    ]
  },
  {
    id: 5,
    dimension: 'elder',
    question: '吃饭时，你的习惯是？',
    options: [
      { label: 'A', text: '疯狂给别人夹菜"多吃点"', score: 8 },
      { label: 'B', text: '询问忌口，各取所需', score: 1 },
      { label: 'C', text: '点评菜品"这还不如我做的"', score: 9 },
      { label: 'D', text: '安静吃饭，偶尔聊聊天', score: 2 }
    ]
  },
  {
    id: 6,
    dimension: 'awkward',
    question: '在家庭群里，你经常发什么？',
    options: [
      { label: 'A', text: '早安晚安+荷花表情包', score: 8 },
      { label: 'B', text: '各种谣言和伪科学文章', score: 10 },
      { label: 'C', text: '催婚催生+人生指导', score: 9 },
      { label: 'D', text: '发红包+节日祝福', score: 2 }
    ]
  },
  {
    id: 7,
    dimension: 'command',
    question: '别人说话时，你的表现是？',
    options: [
      { label: 'A', text: '经常打断"不对不对，应该是"', score: 10 },
      { label: 'B', text: '认真听完再发表意见', score: 1 },
      { label: 'C', text: '一边听一边摇头叹气', score: 7 },
      { label: 'D', text: '选择性倾听', score: 4 }
    ]
  },
  {
    id: 8,
    dimension: 'pose',
    question: '对于年轻人的消费观，你的看法是？',
    options: [
      { label: 'A', text: '"就知道乱花钱，不会过日子"', score: 9 },
      { label: 'B', text: '理解并尊重不同的消费方式', score: 1 },
      { label: 'C', text: '"我们那时候一块钱能买一堆"', score: 8 },
      { label: 'D', text: '默默帮晚辈买单', score: 3 }
    ]
  },
  {
    id: 9,
    dimension: 'knowitall',
    question: '你最常说的口头禅是？',
    options: [
      { label: 'A', text: '"我都是为你好"', score: 10 },
      { label: 'B', text: '"你不懂，听我的"', score: 9 },
      { label: 'C', text: '"现在的年轻人啊..."', score: 8 },
      { label: 'D', text: '"随便，都行"', score: 2 }
    ]
  },
  {
    id: 10,
    dimension: 'awkward',
    question: '拍照时，你的表现是？',
    options: [
      { label: 'A', text: '必须站C位，还要指挥站位', score: 9 },
      { label: 'B', text: '配合摆pose，开心就好', score: 2 },
      { label: 'C', text: '嫌弃别人拍得不好看', score: 7 },
      { label: 'D', text: '拒绝拍照"拍什么拍"', score: 5 }
    ]
  }
]

var DIMENSION_MAP = {
  elder: { name: '长辈感', icon: '/assets/icons/elder.png', color: '#FF7A45', bgColor: '#FFF0E6' },
  pose: { name: '端着感', icon: '/assets/icons/tea.png', color: '#5B9BD5', bgColor: '#E8F4FD' },
  knowitall: { name: '懂王感', icon: '/assets/icons/crown.png', color: '#F5A623', bgColor: '#FFF8E1' },
  awkward: { name: '冷场感', icon: '/assets/icons/mic.png', color: '#9B59B6', bgColor: '#F3E8FF' },
  seniority: { name: '资历感', icon: '/assets/icons/medal.png', color: '#4CAF50', bgColor: '#E8F5E9' },
  command: { name: '指挥感', icon: '/assets/icons/megaphone.png', color: '#2196F3', bgColor: '#E3F2FD' }
}

function calcDimensionScores(questions, answers) {
  var dimScores = {}
  var dimMax = {}
  var keys = Object.keys(DIMENSION_MAP)
  for (var k = 0; k < keys.length; k++) {
    dimScores[keys[k]] = 0
    dimMax[keys[k]] = 0
  }
  for (var i = 0; i < answers.length; i++) {
    var q = questions[i]
    var optIdx = answers[i]
    if (optIdx < 0 || !q) continue
    var dim = q.dimension
    var opt = q.options[optIdx]
    if (!opt) continue
    dimScores[dim] = (dimScores[dim] || 0) + opt.score
    var maxInQ = 0
    for (var j = 0; j < q.options.length; j++) {
      if (q.options[j].score > maxInQ) maxInQ = q.options[j].score
    }
    dimMax[dim] = (dimMax[dim] || 0) + maxInQ
  }
  var result = {}
  for (var m = 0; m < keys.length; m++) {
    var key = keys[m]
    var maxVal = dimMax[key] || 1
    var pct = Math.round((dimScores[key] / maxVal) * 100)
    var info = DIMENSION_MAP[key]
    result[key] = {
      key: key,
      name: info.name,
      icon: info.icon,
      color: info.color,
      bgColor: info.bgColor,
      score: dimScores[key],
      maxScore: maxVal,
      percent: pct,
      level: pct >= 70 ? '偏高' : (pct >= 40 ? '明显' : '中等')
    }
  }
  return result
}

function calcOldScore(dimensionResult) {
  var total = 0
  var count = 0
  var keys = Object.keys(dimensionResult)
  for (var i = 0; i < keys.length; i++) {
    total += dimensionResult[keys[i]].percent
    count++
  }
  return count > 0 ? Math.round(total / count) : 0
}

function getLevel(percentage) {
  if (percentage >= 80) return '传说级老登'
  if (percentage >= 60) return '资深老登'
  if (percentage >= 40) return '潜力型老登'
  if (percentage >= 20) return '萌新选手'
  return '反骨仔'
}

function getLevelDesc(percentage) {
  if (percentage >= 80) return '你的老登指数已经突破天际！'
  if (percentage >= 60) return '老登气质已经相当明显了'
  if (percentage >= 40) return '有成为老登的潜质，继续努力'
  if (percentage >= 20) return '老登指数较低，还需修炼'
  return '你完全不是老登的料！'
}

function getTopFeatures(dimensionResult) {
  var arr = []
  var keys = Object.keys(dimensionResult)
  for (var i = 0; i < keys.length; i++) {
    arr.push(dimensionResult[keys[i]])
  }
  arr.sort(function(a, b) { return b.percent - a.percent })
  return arr.slice(0, 3)
}

Page({
  data: {
    questions: [],
    currentIndex: 0,
    selectedIndex: -1,
    tappingIndex: -1,
    answers: [],
    progressPercent: 0,
    isLastQuestion: false,
    currentQuestion: null
  },

  onLoad: function(options) {
    this.quizOptions = options || {}
    this.initQuiz()
  },

  initQuiz: function() {
    var questions = mockQuestions
    var answers = []
    for (var i = 0; i < questions.length; i++) {
      answers.push(-1)
    }
    this.setData({
      questions: questions,
      currentIndex: 0,
      selectedIndex: -1,
      tappingIndex: -1,
      answers: answers,
      progressPercent: Math.round((1 / questions.length) * 100),
      isLastQuestion: false,
      currentQuestion: questions[0]
    })
  },

  onSelectOption: function(e) {
    var that = this
    var index = e.currentTarget.dataset.index

    if (this.data.selectedIndex !== -1) return

    this.setData({
      selectedIndex: index,
      tappingIndex: index
    })
    wx.vibrateShort({ type: 'light' })

    var answers = this.data.answers.slice()
    answers[this.data.currentIndex] = index
    this.setData({ answers: answers })

    setTimeout(function() {
      that.setData({ tappingIndex: -1 })
    }, 150)

    var that2 = this
    setTimeout(function() {
      if (that2.data.isLastQuestion) {
        that2.finishQuiz()
      } else {
        that2.goToNextQuestion()
      }
    }, 500)
  },

  goToNextQuestion: function() {
    var nextIndex = this.data.currentIndex + 1
    var total = this.data.questions.length
    this.setData({
      currentIndex: nextIndex,
      selectedIndex: -1,
      progressPercent: Math.round(((nextIndex + 1) / total) * 100),
      isLastQuestion: nextIndex === total - 1,
      currentQuestion: this.data.questions[nextIndex]
    })
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  finishQuiz: function() {
    var questions = this.data.questions
    var answers = this.data.answers

    wx.setStorageSync('answers', answers)

    var dimensionResult = calcDimensionScores(questions, answers)
    var oldScore = calcOldScore(dimensionResult)
    var level = getLevel(oldScore)
    var levelDesc = getLevelDesc(oldScore)
    var topFeatures = getTopFeatures(dimensionResult)

    var selfResult = {
      totalScore: 0,
      oldScore: oldScore,
      percentage: oldScore,
      level: level,
      levelDesc: levelDesc,
      dimensionResult: dimensionResult,
      topFeatures: topFeatures,
      answers: answers,
      timestamp: Date.now()
    }

    var totalScore = 0
    for (var i = 0; i < answers.length; i++) {
      if (answers[i] >= 0 && questions[i] && questions[i].options[answers[i]]) {
        totalScore += questions[i].options[answers[i]].score
      }
    }
    selfResult.totalScore = totalScore

    wx.setStorageSync('selfResult', selfResult)

    if (this.quizOptions && this.quizOptions.mode === 'friend') {
      wx.setStorageSync('friendResult', selfResult)
      wx.redirectTo({
        url: '/pages/duelResult/duelResult'
      })
    } else {
      wx.navigateTo({
        url: '/pages/halfResult/halfResult?percentage=' + oldScore + '&level=' + level + '&levelDesc=' + levelDesc
      })
    }
  },

  onShareAppMessage: function() {
    return {
      title: '我正在测老登味，你也来试试！',
      path: '/pages/home/home'
    }
  }
})
