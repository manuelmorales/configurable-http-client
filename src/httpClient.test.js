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
    it(`is run after making the request`, (done) => {
      this.httpClient
        .onResponse((resp) => {
          expect(resp.body).toEqual("Hello")
          done()
        })
        .runRequest('/test')
        .catch(done)
    })

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
    it(`is run after making the request`, (done) => {
      this.httpClient
        .onSuccess((resp) => {
          expect(resp.body).toEqual("Hello")
          done()
        })
        .runRequest('/test')
    })

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

    it(`overrides onResponse`, (done) => {
      const onResponse = jest.fn()
      const onSuccess = jest.fn()

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onSuccess(onSuccess)

      newClient.runRequest('/test').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onSuccess).toHaveBeenCalled()
        done()
      })
    })

    it(`doesn't override onResponse on error requests`, (done) => {
      const onResponse = jest.fn()
      const onSuccess = jest.fn()

      this.fetch.get('/missing_path', 404)

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onSuccess(onSuccess)

      newClient.runRequest('/missing_path').then(() => {
        expect(onResponse).toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
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
      const onError = jest.fn((resp) => { expect(resp.body).toEqual('Not Found') })
      const onSuccess = jest.fn()

      const newClient = this.httpClient
            .onResponse(onResponse)
            .onError(onError)
            .onSuccess(onSuccess)

      newClient.runRequest('/not_found').then(() => {
        expect(onResponse).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalled()
        expect(onSuccess).not.toHaveBeenCalled()
        done()
      })
    })
  })
})
