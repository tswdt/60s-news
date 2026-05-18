Component({
  properties: {
    title: {
      type: String,
      value: '出错了'
    },
    desc: {
      type: String,
      value: '当前页面数据异常，请重新进入。'
    },
    buttonText: {
      type: String,
      value: '返回首页'
    }
  },

  methods: {
    onRetry: function() {
      this.triggerEvent('retry')
    }
  }
})
