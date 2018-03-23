const httpClient = {
  values: {},
  defaultValuesFunctions: {},

  value: function(name) {
    if (this.values[name]) {
      return this.values[name]
    } else if (this.defaultValuesFunctions[name]) {
      return this.defaultValuesFunctions[name]()
    } else {
      throw "value " + name + " not found"
    }
  },

  defineValue: function(key, defaultFunction) {
    this[key] = function (value) { return this.newWithValue(key, value) }
    this.defaultValuesFunctions[key] = defaultFunction
  },

  defineMergedValue: function(key, defaultFunction) {
    this.defineValue(key, defaultFunction)

    this[key] = function (subValues) {
      return this.newWithMergedValue(key, subValues)
    }
  },

  newWithValue: function(key, value) {
    const newValues = Object.assign({}, this.values)
    newValues[key] = value

    return Object.assign({}, this, {values: newValues})
  },

  newWithMergedValue: function(key, object) {
    const oldObject = this.value(key)
    const newObject = Object.assign({}, oldObject, object)
    return this.newWithValue(key, newObject)
  },

  findCallbackByStatus: function (resp) {
    return this.value('onStatusCallbacks')[resp.status]
  },

  findCallbackBySuccess: function (resp) {
    return resp.ok ? this.value('onSuccess') : this.value('onError')
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
};

httpClient.defineValue('fetch', () => global.fetch);
httpClient.defineValue('onResponse', () => resp => resp);
httpClient.defineValue('onSuccess', () => null);
httpClient.defineValue('onError', () => null);
httpClient.defineMergedValue('onStatusCallbacks', () => ({}));

httpClient.onStatus = function (status, callback) {
  const argument = {}
  argument[status] = callback
  return this.onStatusCallbacks(argument)
}

module.exports = httpClient
