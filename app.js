App({
  onLaunch() {
    wx.getSystemInfoSync()
  },
  globalData: {
    userInfo: null,
    quizResult: null
  }
})
