module.exports = {
  setFetch: function (fetch) { return Object.assign({}, this, {fetchAttribute: fetch}) },
  getFetch: function () { return (this.fetchAttribute || global.fetch) },
  onResponseCallback: function(resp) { return resp },

  runRequest: function (url) {
    return (
      this.getFetch()(url)
        .then((resp) => this.onResponseCallback(resp))
    )
  },

  onResponse: function (callback) {
    return Object.assign({}, this, {onResponseCallback: callback}) 
  }
}
