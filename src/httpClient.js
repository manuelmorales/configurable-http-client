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
    defaultFunction = defaultFunction || function () { return null }

    this[key] = function (value) { return this.newWithValue(key, value) }
    this.defaultValuesFunctions[key] = defaultFunction
  },

  defineMergedValue: function(key, defaultFunction) {
    defaultFunction = defaultFunction || function () { return {} }
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
    return resp.ok ? this.value('onSuccess') : this.value('onErrorResponse')
  },

  request: function (url, opts) {
    return this
      .url(url)
      .requestOptions(opts)
  },

  runRequest: function (url, opts) {
    return this.request(url, opts).run()
  },

  run: function () {
    const url = this.value('url')
    const opts = this.value('requestOptions')

    const fetch = this.value('fetch')
    const fetchOpts = Object.assign({}, opts) || {}

    if (fetchOpts.json_body) {
      fetchOpts['body'] = JSON.stringify(fetchOpts.json_body)

      fetchOpts['headers'] = Object.assign(
        opts.headers || {},
        {'Content-Type':'application/json; charset=utf-8'}
      )

      delete fetchOpts.json_body
    }

    const promise = fetch(url, fetchOpts)
      .then((response) => {
        let callback =
          this.findCallbackByStatus(response) ||
          this.findCallbackBySuccess(response) ||
          this.value('onResponse')

        return callback(response)
      }, this.value('onConnectionError'))

    return (promise)
  }
};

httpClient.defineValue('fetch', () => global.fetch);
httpClient.defineValue('onResponse', () => resp => resp);
httpClient.defineValue('onSuccess');
httpClient.defineValue('onErrorResponse');
httpClient.defineValue('onConnectionError', () => err => err);
httpClient.defineMergedValue('onStatusCallbacks');
httpClient.defineMergedValue('requestOptions');
httpClient.defineValue('url');

httpClient.onStatus = function (status, callback) {
  const argument = {}
  argument[status] = callback
  return this.onStatusCallbacks(argument)
}

module.exports = httpClient
