module.exports = {
  setFetch: function (fetch) { return Object.assign({}, this, {fetchAttribute: fetch}) },
  getFetch: function () { return (this.fetchAttribute || global.fetch) },

  onResponseCallback: function(resp) { return resp },
  onResponse: function (callback) {
    return Object.assign({}, this, {onResponseCallback: callback})
  },

  onSuccessCallback: null,
  onSuccess: function (callback) {
    return Object.assign({}, this, {onSuccessCallback: callback})
  },

  onErrorCallback: null,
  onError: function (callback) {
    return Object.assign({}, this, {onErrorCallback: callback})
  },

  onStatusCallbacks: {},
  onStatus: function (status, callback) {
    const newCallbacks = Object.assign({}, this.onStatusCallbacks)
    newCallbacks[status] = callback
    return Object.assign({}, this, {onStatusCallbacks: newCallbacks})
  },

  runRequest: function (url) {
    let callback = this.onResponseCallback

    const promise = this.getFetch()(url).then((response) => {
      if (this.onStatusCallbacks[response.status]) {
        callback = this.onStatusCallbacks[response.status]
      } else if (response.ok) {
        callback = this.onSuccessCallback || this.onResponseCallback
      } else {
        callback = this.onErrorCallback || this.onResponseCallback
      }

      return callback(response)
    })

    return (promise)
  }
}
