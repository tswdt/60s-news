Component({
  properties: {
    title: {
      type: String,
      value: '出错了'
    },
    desc: {
      type: String,
      value: '请稍后再试'
    },
    btnText: {
      type: String,
      value: '重试'
    }
  },

  methods: {
    onRetry: function() {
      this.triggerEvent('retry')
    }
  }
})
