Component({
  properties: {
    current: {
      type: Number,
      value: 1
    },
    total: {
      type: Number,
      value: 10
    },
    percent: {
      type: Number,
      value: 0
    }
  },

  data: {
    computedPercent: 0
  },

  observers: {
    'current, total, percent': function(current, total, percent) {
      var computed = 0
      if (percent > 0) {
        computed = percent
      } else if (total > 0) {
        computed = Math.round((current / total) * 100)
      }
      this.setData({
        computedPercent: computed
      })
    }
  }
})
