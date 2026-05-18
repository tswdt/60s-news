Page({
  data: {},

  onStartQuiz: function() {
    wx.navigateTo({
      url: '/pages/quiz/quiz'
    })
  },

  onInviteFriend: function() {
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

  onShareAppMessage: function() {
    return {
      title: '谁才是老登？来测测你身边的隐藏老登！',
      path: '/pages/home/home'
    }
  }
})
