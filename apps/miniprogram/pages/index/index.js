var SUBJECTS = [
  { key: 'math', icon: '📐', name: '数学' },
  { key: 'chinese', icon: '📝', name: '语文' },
  { key: 'english', icon: '🔤', name: '英语' },
  { key: 'physics', icon: '⚡', name: '物理' },
  { key: 'chemistry', icon: '🧪', name: '化学' },
  { key: 'history', icon: '📜', name: '历史' },
  { key: 'biology', icon: '🧬', name: '生物' },
  { key: 'geography', icon: '🌍', name: '地理' },
  { key: 'geometry', icon: '📏', name: '几何' }
]

var GRADE_GROUPS = [
  {
    label: '小学',
    items: [
      { key: '1', name: '一' }, { key: '2', name: '二' },
      { key: '3', name: '三' }, { key: '4', name: '四' },
      { key: '5', name: '五' }, { key: '6', name: '六' }
    ]
  },
  {
    label: '初中',
    items: [
      { key: '7', name: '初一' }, { key: '8', name: '初二' }, { key: '9', name: '初三' }
    ]
  },
  {
    label: '高中',
    items: [
      { key: '10', name: '高一' }, { key: '11', name: '高二' }, { key: '12', name: '高三' }
    ]
  }
]

var MODELS = [
  { key: 'deepseek', name: 'DeepSeek' },
  { key: 'qwen', name: '通义千问' }
]

var QUICK_QUESTIONS = [
  '为什么负负得正？',
  '三角形内角和为什么是180度？',
  '什么是光合作用？',
  '二次函数的图像是什么样的？'
]

Page({
  data: {
    subjects: SUBJECTS,
    gradeGroups: GRADE_GROUPS,
    models: MODELS,
    quickQuestions: QUICK_QUESTIONS,
    subject: 'math',
    grade: '7',
    model: 'deepseek'
  },

  onLoad: function () {
    var app = getApp()
    this.setData({
      subject: app.globalData.subject || 'math',
      grade: app.globalData.grade || '7',
      model: app.globalData.model || 'deepseek'
    })
  },

  onChooseSubject: function (e) {
    this.setData({ subject: e.currentTarget.dataset.subject })
  },

  onChooseGrade: function (e) {
    this.setData({ grade: e.currentTarget.dataset.grade })
  },

  onChooseModel: function (e) {
    this.setData({ model: e.currentTarget.dataset.model })
  },

  onQuickQuestion: function (e) {
    var app = getApp()
    app.globalData.subject = this.data.subject
    app.globalData.grade = this.data.grade
    app.globalData.model = this.data.model
    app.globalData.initialQuestion = e.currentTarget.dataset.q
    wx.switchTab({ url: '/pages/tutor/tutor' })
  },

  onStartTutor: function () {
    var app = getApp()
    app.globalData.subject = this.data.subject
    app.globalData.grade = this.data.grade
    app.globalData.model = this.data.model
    wx.switchTab({ url: '/pages/tutor/tutor' })
  }
})
