const originalHttpClient = require('./httpClient')
const fetchMock = require('fetch-mock')

describe('httpClient', () => {
  beforeEach(() => {
    this.fetch = fetchMock.sandbox()
    this.fetch.get('/test', "Hello")
    this.httpClient = originalHttpClient.setFetch(this.fetch)
  })

  describe('fetch', () => {
    it('uses global.fetch by default', () => {
      this.httpClient.request('/test')
      expect(this.fetch.lastCall()).not.toBe(undefined)
    })

    it('allows setting a new fetch()', () => {
      const newFetch = fetchMock.sandbox().get('/test2', "Hello")
      this.httpClient = this.httpClient.setFetch(newFetch)

      this.httpClient.request('/test2')

      expect(newFetch.lastCall()).not.toBe(undefined)
    })

    it('doesnt\'t override the original one', () => {
      const newFetch = fetchMock.sandbox().get('/test2', "Hello")
      this.httpClient = this.httpClient.setFetch(newFetch)

      this.httpClient.request('/test2')

      expect(this.fetch.lastCall()).toBe(undefined)
    })
  })

  describe('request', () => {
    it('returns the response from fetch', (done) => {
      this.httpClient.request('/test')

        .then((resp) => {
          expect(resp.body).toEqual("Hello")
          done()
        })

        .catch(done)
    })
  })

  describe('onResponse', () => {
    it('is run after making the request', (done) => {
      this.httpClient
        .onResponse((resp) => {
          expect(resp.body).toEqual("Hello")
          done()
        })
        .request('/test')
    })
  })
})
