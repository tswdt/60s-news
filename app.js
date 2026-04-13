App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'w3221540766-1gipotvhc2ceb014',
        traceUser: true
      })
    }
  },
  globalData: {
    userInfo: null
  }
})