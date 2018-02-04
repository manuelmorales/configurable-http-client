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

  findCallbackByStatus: function (resp) {
    return this.onStatusCallbacks[resp.status]
  },

  findCallbackBySuccess: function (resp) {
    return resp.ok ? this.onSuccessCallback : this.onErrorCallback
  },

  runRequest: function (url, opts) {
    const fetch = this.getFetch()
    const fetchOpts = (opts && Object.assign({}, opts)) || {}

    if (fetchOpts.json_body) {
      fetchOpts['body'] = JSON.stringify(fetchOpts.json_body)

      fetchOpts['headers'] = Object.assign(
        opts.headers || {},
        {'Content-Type':'application/json'}
      )

      delete fetchOpts.json_body
    }

    const promise = fetch(url, fetchOpts).then((response) => {
      let callback =
          this.findCallbackByStatus(response) ||
          this.findCallbackBySuccess(response) ||
          this.onResponseCallback

      return callback(response)
    })

    return (promise)
  }
}
