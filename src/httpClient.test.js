const originalHttpClient = require('./httpClient')
const fetchMock = require('fetch-mock')

describe(`httpClient`, () => {
  beforeEach(() => {
    this.fetch = fetchMock.sandbox()
    this.fetch.get('/test', "Hello")
    this.fetch.get('/not_found', {status: 404, body: "Not Found"})
    this.httpClient = originalHttpClient.setFetch(this.fetch)
  })

  describe(`fetch`, () => {
    it(`uses global.fetch by default`, () => {
      this.httpClient.runRequest('/test')
      expect(this.fetch.lastCall()).not.toBe(undefined)
    })

    it(`allows setting a new fetch()`, () => {
      const newFetch = fetchMock.sandbox().get('/test2', "Hello")
      this.httpClient = this.httpClient.setFetch(newFetch)

      this.httpClient.runRequest('/test2')

      expect(newFetch.lastCall()).not.toBe(undefined)
    })

    it(`doesn't override the original one`, () => {
      const newFetch = fetchMock.sandbox().get('/test2', "Hello")
      this.httpClient = this.httpClient.setFetch(newFetch)

      this.httpClient.runRequest('/test2')

      expect(this.fetch.lastCall()).toBe(undefined)
    })
  })

  describe(`request`, () => {
    it(`returns the response from fetch`, (done) => {
      this.httpClient.runRequest('/test')

        .then((resp) => {
          expect(resp.body).toEqual("Hello")
          done()
        })

        .catch(done)
    })
  })

  describe(`onResponse`, () => {
    it(`doesn't overwrite the original one`, (done) => {
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
  })

  describe(`onSuccess`, () => {
    it(`doesn't overwrite the original one`, (done) => {
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
  })

  describe(`onStatus`, () => {
    it(`doesn't overwrite the original one`, (done) => {
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
      const onError = jest.fn()
      const onSuccess = jest.fn((resp) => { expect(resp.body).toEqual('Hello') })

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onError(onError)
            .onSuccess(onSuccess)

      newClient.runRequest('/test').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onError).not.toHaveBeenCalled()
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

    it(`gives precedence to onError over onResponse`, (done) => {
      const onResponse = jest.fn()
      const onSuccess = jest.fn()
      const onError = jest.fn((resp) => { expect(resp.body).toEqual('Not Found') })

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onError(onError)
            .onSuccess(onSuccess)

      newClient.runRequest('/not_found').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalled()
        done()
      })
    })

    it(`gives precedence to onStatus(404) over onError`, (done) => {
      const onResponse = jest.fn()
      const onSuccess = jest.fn()
      const onError = jest.fn()
      const on403 = jest.fn()
      const on404 = jest.fn((resp) => { expect(resp.body).toEqual('Not Found') })

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onError(onError)
            .onStatus(403, on403)
            .onStatus(404, on404)
            .onSuccess(onSuccess)

      newClient.runRequest('/not_found').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        expect(onError).not.toHaveBeenCalled()
        expect(on403).not.toHaveBeenCalled()
        expect(on404).toHaveBeenCalled()
        done()
      })
    })
  })
})
