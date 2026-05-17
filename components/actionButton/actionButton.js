Component({
  properties: {
    text: {
      type: String,
      value: '按钮'
    },
    type: {
      type: String,
      value: 'primary'
    },
    icon: {
      type: String,
      value: ''
    },
    full: {
      type: Boolean,
      value: true
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onTap: function() {
      if (this.data.disabled) return
      this.triggerEvent('tap')
    }
  }
})
