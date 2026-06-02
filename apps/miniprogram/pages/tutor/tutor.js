var tutorApi = require('../../utils/tutorApi.js')

var SUBJECT_LABELS = {
  math: '数学', chinese: '语文', english: '英语',
  physics: '物理', chemistry: '化学', history: '历史',
  biology: '生物', geography: '地理', politics: '政治', geometry: '几何'
}

var GRADE_LABELS = {
  '1': '一年级', '2': '二年级', '3': '三年级',
  '4': '四年级', '5': '五年级', '6': '六年级',
  '7': '初一', '8': '初二', '9': '初三',
  '10': '高一', '11': '高二', '12': '高三'
}

var MODEL_LABELS = {
  deepseek: 'DeepSeek',
  qwen: '通义千问'
}

Page({
  data: {
    subject: 'math',
    grade: '7',
    model: 'deepseek',
    subjectLabel: '数学',
    gradeLabel: '初一',
    modelLabel: 'DeepSeek',

    inputValue: '',
    isLoading: false,

    aiReply: '',
    questionToStudent: '',
    currentTopic: '',
    currentStep: 0,
    hintLevel: 0,
    showHint: false,
    misconceptionCheck: [],

    currentVisual: { type: 'none', stepIndex: 0, data: null },
    visualLabel: '',
    gridRows: [],

    conversationHistory: []
  },

  onLoad: function () {
    var app = getApp()
    var subject = app.globalData.subject || 'math'
    var grade = app.globalData.grade || '7'
    var model = app.globalData.model || 'deepseek'

    this.setData({
      subject: subject,
      grade: grade,
      model: model,
      subjectLabel: SUBJECT_LABELS[subject] || subject,
      gradeLabel: GRADE_LABELS[grade] || grade,
      modelLabel: MODEL_LABELS[model] || model
    })

    if (app.globalData.initialQuestion) {
      var q = app.globalData.initialQuestion
      app.globalData.initialQuestion = ''
      this.setData({ inputValue: q })
    }
  },

  onInput: function (e) {
    this.setData({ inputValue: e.detail.value })
  },

  onSend: function () {
    var text = this.data.inputValue.trim()
    if (!text || this.data.isLoading) return

    var history = this.data.conversationHistory.concat([
      { role: 'user', content: text }
    ])

    this.setData({
      inputValue: '',
      isLoading: true,
      showHint: false,
      misconceptionCheck: []
    })

    var that = this
    tutorApi.callTutor({
      userMessage: text,
      subject: this.data.subject,
      grade: this.data.grade,
      conversationHistory: this.data.conversationHistory,
      currentStep: this.data.currentStep,
      model: this.data.model
    }).then(function (result) {
      var newHistory = history.concat([
        { role: 'assistant', content: result.reply }
      ])

      var gridRows = []
      if (result.visual && result.visual.type === 'rectangle_grid' && result.visual.data) {
        gridRows = that.buildGrid(result.visual.data)
      }

      that.setData({
        conversationHistory: newHistory,
        isLoading: false,
        aiReply: result.reply || '',
        questionToStudent: result.question_to_student || '',
        currentTopic: result.detected_topic || '',
        currentStep: result.current_step || 1,
        hintLevel: result.hint_level || 0,
        misconceptionCheck: result.misconception_check || [],
        currentVisual: result.visual || { type: 'none', stepIndex: 0 },
        visualLabel: tutorApi.getVisualLabel(result.visual ? result.visual.type : 'none'),
        gridRows: gridRows
      })
    }).catch(function () {
      that.setData({
        isLoading: false,
        aiReply: '请求失败，请重试。'
      })
    })
  },

  onShowHint: function () {
    this.setData({ showHint: !this.data.showHint })
  },

  buildGrid: function (data) {
    var rows = data.rows || 3
    var cols = data.cols || 4
    var highlights = data.highlights || []
    var gridRows = []
    for (var r = 0; r < rows; r++) {
      var row = []
      for (var c = 0; c < cols; c++) {
        var isHighlight = false
        for (var h = 0; h < highlights.length; h++) {
          if (highlights[h][0] === r && highlights[h][1] === c) {
            isHighlight = true
            break
          }
        }
        row.push({ highlight: isHighlight })
      }
      gridRows.push(row)
    }
    return gridRows
  }
})
