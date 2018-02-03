module.exports = {
  setFetch: function (fetch) { return Object.assign({}, this, {fetchAttribute: fetch}) },
  getFetch: function () { return (this.fetchAttribute || global.fetch) },

  get: function (url) {
    return this.getFetch()(url)
  }
}
