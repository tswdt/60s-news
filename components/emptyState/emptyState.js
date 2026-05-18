Component({
  properties: {
    title: {
      type: String,
      value: '还没有结果'
    },
    desc: {
      type: String,
      value: '先完成一次鉴定吧。'
    },
    buttonText: {
      type: String,
      value: '开始鉴定'
    }
  },

  methods: {
    onAction: function() {
      this.triggerEvent('action')
    }
  }
})
