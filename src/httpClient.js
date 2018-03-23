module.exports = {
  values: {},

  defaultValuesFunctions: {
    onResponse: function() { return function(resp) { return resp } }
  },

  value: function(name) {
    if (this.values[name]) {
      return this.values[name]
    } else if (this.defaultValuesFunctions[name]) {
      return this.defaultValuesFunctions[name]()
    } else {
      throw "value not found"
    }
  },

  newWithValue: function(key, value) {
    const newValues = Object.assign({}, this.values)
    newValues[key] = value

    return Object.assign({}, this, {values: newValues})
  },

  onResponse: function(value) { return this.newWithValue('onResponse', value) },
  fetch: function(value) { return this.newWithValue('fetch', value) },

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

  requestUrl: function (url) {
    return Object.assign({}, this, {requestUrlValue: url})
  },

  requestOptions: function (opts) {
    const options = {optionsValue: Object.assign({}, this.optionsValue, opts)}
    return Object.assign({}, this, options)
  },

  request: function (url, opts) {
    return this
      .requestUrl(url)
      .requestOptions(opts)
  },

  runRequest: function (url, opts) {
    return this.request(url, opts).run()
  },

  run: function () {
    const url = this.requestUrlValue
    const opts = this.optionsValue || {}

    const fetch = this.value('fetch')
    const fetchOpts = Object.assign({}, opts) || {}

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
          this.value('onResponse')

      return callback(response)
    })

    return (promise)
  }
}
