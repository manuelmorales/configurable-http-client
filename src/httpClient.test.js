const originalHttpClient = require('./httpClient')
const fetchMock = require('fetch-mock')

describe(`httpClient`, () => {
  beforeEach(() => {
    this.fetch = fetchMock.sandbox()
    this.fetch.get('/test', "Hello")
    this.fetch.get('/not_found', {status: 404, body: "Not Found"})
    this.httpClient = originalHttpClient.fetch(this.fetch)
  })

  describe(`fetch`, () => {
    it(`uses global.fetch by default`, () => {
      this.httpClient.runRequest('/test')
      expect(this.fetch.lastCall()).not.toBe(undefined)
    })

    it(`allows setting a new fetch()`, () => {
      const newFetch = fetchMock.sandbox().get('/test2', "Hello")
      this.httpClient = this.httpClient.fetch(newFetch)

      this.httpClient.runRequest('/test2')

      expect(newFetch.lastCall()).not.toBe(undefined)
    })

    it(`doesn't override the original one`, () => {
      const newFetch = fetchMock.sandbox().get('/test2', "Hello")
      this.httpClient = this.httpClient.fetch(newFetch)

      this.httpClient.runRequest('/test2')

      expect(this.fetch.lastCall()).toBe(undefined)
    })
  })

  describe(`runRequest`, () => {
    it(`returns the response from fetch`, (done) => {
      this.httpClient.runRequest('/test')

        .then((resp) => {
          expect(resp.body).toEqual("Hello")
          done()
        })

        .catch(done)
    })
  })

  it(`onResponse doesn't overwrite the original one`, (done) => {
    const oldSpy = jest.fn()
    const oldClient = this.httpClient.onResponse(oldSpy)

    const newSpy = jest.fn()
    const newClient = oldClient.onResponse(newSpy)

    newClient.runRequest('/test').then(() => {
      expect(oldSpy).not.toHaveBeenCalled()
      expect(newSpy).toHaveBeenCalled()
      done()
    })
  })

  it(`onSuccess doesn't overwrite the original one`, (done) => {
    const oldSpy = jest.fn()
    const oldClient = this.httpClient.onSuccess(oldSpy)

    const newSpy = jest.fn()
    const newClient = oldClient.onSuccess(newSpy)

    newClient.runRequest('/test').then(() => {
      expect(oldSpy).not.toHaveBeenCalled()
      expect(newSpy).toHaveBeenCalled()
      done()
    })
  })

  it(`onStatus doesn't overwrite the original one`, (done) => {
    const oldSpy = jest.fn()
    const oldClient = this.httpClient.onResponse(oldSpy)

    const newSpy = jest.fn()
    const newClient = oldClient.onStatus(404, newSpy)

    oldClient.runRequest('/not_found').then(() => {
      expect(newSpy).not.toHaveBeenCalled()
      expect(oldSpy).toHaveBeenCalled()
      done()
    })
  })

  describe(`on 200`, () => {
    it(`onResponse is called`, (done) => {
      const onResponse = jest.fn((resp) => { expect(resp.body).toEqual('Hello') })

      const newClient = this.httpClient.onResponse(onResponse)

      newClient.runRequest('/test').then(() => {
        expect(onResponse).toHaveBeenCalled()
        done()
      })
    })

    it(`gives precedence to onSuccess over onResponse`, (done) => {
      const onResponse = jest.fn()
      const onErrorResponse = jest.fn()
      const onSuccess = jest.fn((resp) => { expect(resp.body).toEqual('Hello') })

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onErrorResponse(onErrorResponse)
            .onSuccess(onSuccess)

      newClient.runRequest('/test').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onErrorResponse).not.toHaveBeenCalled()
        expect(onSuccess).toHaveBeenCalled()
        done()
      })
    })
  })

  describe(`on 400`, () => {
    it(`onResponse is called`, (done) => {
      const onResponse = jest.fn((resp) => { expect(resp.body).toEqual('Not Found') })

      const newClient = this.httpClient.onResponse(onResponse)

      newClient.runRequest('/not_found').then(() => {
        expect(onResponse).toHaveBeenCalled()
        done()
      })
    })

    it(`gives precedence to onErrorResponse over onResponse`, (done) => {
      const onResponse = jest.fn()
      const onSuccess = jest.fn()
      const onErrorResponse = jest.fn((resp) => { expect(resp.body).toEqual('Not Found') })

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onErrorResponse(onErrorResponse)
            .onSuccess(onSuccess)

      newClient.runRequest('/not_found').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        expect(onErrorResponse).toHaveBeenCalled()
        done()
      })
    })

    it(`gives precedence to onStatus(404) over onErrorResponse`, (done) => {
      const onResponse = jest.fn()
      const onSuccess = jest.fn()
      const onErrorResponse = jest.fn()
      const on403 = jest.fn()
      const on404 = jest.fn((resp) => { expect(resp.body).toEqual('Not Found') })

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onErrorResponse(onErrorResponse)
            .onStatus(403, on403)
            .onStatus(404, on404)
            .onSuccess(onSuccess)

      newClient.runRequest('/not_found').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        expect(onErrorResponse).not.toHaveBeenCalled()
        expect(on403).not.toHaveBeenCalled()
        expect(on404).toHaveBeenCalled()
        done()
      })
    })
  })

  it(`allows POST`, (done) => {
    this.fetch.post('/post', "Hello")

    this.httpClient.runRequest('/post', { method: 'POST' }).then(() => {
      expect(this.fetch.called('/post')).toBe(true)
      done()
    })
  })

  it(`allows passing an object as json_body`, (done) => {
    this.fetch.post('/post', (path, opts) => {
      expect(opts.body).toEqual('{"a":1}')
      expect(opts.headers['Content-Type']).toEqual('application/json; charset=utf-8')
      return 200
    })

    const opts = { method: 'POST', json_body: {a: 1} }

    this.httpClient.runRequest('/post', opts).then(() => {
      expect(this.fetch.called('/post')).toBe(true)
      done()
    })
  })

  it('allows setting the request before the callbacks with request()', (done) => {
    this.httpClient.request('/test').onStatus(200, () => done()).run()
  })

  it('allows setting the request options before the callbacks', (done) => {
    const options = {credentials: 'same-origin'}

    this.fetch.get('/assert_options', (path, opts) => {
      return new Promise((resolve) => {
        expect(opts).toEqual(options)
        resolve('Some body')
        done()
      })
    })

    this.httpClient
      .requestOptions(options)
      .runRequest('/assert_options')
  })

  it(`allows clearing callbacks passing null`, (done) => {
    const onSuccess = jest.fn()
    const on200 = jest.fn()

    const newClient = this.httpClient
      .onSuccess(onSuccess)
      .onStatus(200, on200)
      .onStatus(200, null)

    newClient.runRequest('/test').then(() => {
      expect(on200).not.toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
      done()
    })
  })

  describe('onConnectionError', () => {
    it(`allows defining behavior on connection error`, () => {
      expect.assertions(1)

      this.fetch.get('/connection_error', () => { throw 'Connection Error'})

      const newClient = this.httpClient
        .onConnectionError((err) => { expect(err).toEqual('Connection Error') })
        .request('/connection_error')

      newClient.run()
    })

    it(`doesn't catch errors in other callbacks`, (done) => {
      expect.assertions(1)

      this.fetch.get('/connection_error', () => { throw 'Connection Error'})

      const newClient = this.httpClient
        .onSuccess((resp) => { throw 'Expected error' })
        .onConnectionError((err) => { throw 'Unexpected error' })
        .request('/test')

      newClient.run().catch((err) => {
        expect(err).toEqual('Expected error')
        done()
      })
    })

    it(`lets the error go through as default behavior`, (done) => {
      expect.assertions(1)

      this.fetch.get('/connection_error', () => { throw 'Connection Error'})

      this.httpClient.runRequest('/connection_error').catch((err) => {
        expect(err).toEqual('Connection Error')
        done()
      })
    })

  })

  it.skip(`allows reading the parsed_body`, () => {})
  it.skip(`allows passing query params as a parameter`, () => {})
})
