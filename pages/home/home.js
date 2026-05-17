Page({
  data: {},

  onStartQuiz: function() {
    wx.navigateTo({
      url: '/pages/quiz/quiz'
    })
  },

  onShareAppMessage: function() {
    return {
      title: '谁才是老登？来测测你身边的隐藏老登！',
      path: '/pages/home/home',
      imageUrl: '/assets/images/share-cover.png'
    }
  }
})
