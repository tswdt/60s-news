function callTutor(options) {
  var userMessage = options.userMessage
  var subject = options.subject
  var grade = options.grade
  var conversationHistory = options.conversationHistory || []
  var currentStep = options.currentStep || 1
  var model = options.model || 'deepseek'

  return new Promise(function (resolve, reject) {
    wx.cloud.callFunction({
      name: 'tutor',
      data: {
        userMessage: userMessage,
        selectedSubject: subject,
        selectedGrade: grade,
        conversationHistory: conversationHistory,
        currentStep: currentStep,
        modelProvider: model
      },
      success: function (res) {
        if (res.result && res.result.success && res.result.parsed) {
          resolve(res.result.parsed)
        } else if (res.result && res.result.parsed) {
          resolve(res.result.parsed)
        } else {
          var fallback = {
            detected_subject: subject,
            detected_topic: '未知',
            detected_grade: grade,
            teaching_mode: 'explanation',
            current_step: currentStep,
            reply: res.result && res.result.error ? '请求出错：' + res.result.error : 'AI 服务暂时不可用，请稍后再试。',
            question_to_student: '你还有什么不明白的地方吗？',
            visual: { type: 'none', stepIndex: 0 },
            hint_level: 0,
            next_action: 'wait_student_answer'
          }
          resolve(fallback)
        }
      },
      fail: function (err) {
        var fallback = {
          detected_subject: subject,
          detected_topic: '未知',
          detected_grade: grade,
          teaching_mode: 'explanation',
          current_step: currentStep,
          reply: '网络请求失败，请检查网络后重试。',
          question_to_student: '你还有什么不明白的地方吗？',
          visual: { type: 'none', stepIndex: 0 },
          hint_level: 0,
          next_action: 'wait_student_answer'
        }
        resolve(fallback)
      }
    })
  })
}

function isSimpleVisual(visualType) {
  return visualType === 'rectangle_grid'
}

function getVisualLabel(visualType) {
  var labels = {
    triangle_angle_sum_parallel: '三角形内角和',
    rectangle_grid: '长方形面积',
    number_line: '数轴',
    fraction_bar: '分数',
    balance_scale: '方程天平',
    geometry_canvas: '几何画板',
    timeline: '时间线',
    cause_effect_graph: '因果图',
    chem_particle: '化学粒子',
    force_diagram: '力学图',
    none: ''
  }
  return labels[visualType] || '图形讲解'
}

module.exports = {
  callTutor: callTutor,
  isSimpleVisual: isSimpleVisual,
  getVisualLabel: getVisualLabel
}
