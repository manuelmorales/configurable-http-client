const httpClient = require('./httpClient')
const fetchMock = require('fetch-mock')

describe('httpClient', () => {
  describe('fetch', () => {
    it('uses global.fetch by default', () => {
      const fetch = jest.fn()
      global.fetch = fetch

      httpClient.get('https://example.com')

      expect(fetch).toHaveBeenCalled()
    })

    it('allows setting a new fetch()', () => {
      const globalFetch = jest.fn()
      global.fetch = globalFetch

      const fetch = jest.fn()
      httpClient
        .setFetch(fetch)
        .get('https://example.com')

      expect(fetch).toHaveBeenCalled()
    })

    it('doesnt\'t override the original one', () => {
      const globalFetch = jest.fn()
      global.fetch = globalFetch

      const fetch = jest.fn()
      httpClient.setFetch(fetch)

      httpClient.get('https://example.com')

      expect(globalFetch).toHaveBeenCalled()
    })
  })

  describe('get', () => {
    beforeEach(() => {
      this.fetch = fetchMock.sandbox()
      this.fetch.get('/test', 200)
      this.httpClient = httpClient.setFetch(this.fetch)
    })

    it('returns the response from fetch', (done) => {
      this.httpClient.get('/test')
        .then(() => {
          expect(this.fetch.called('/test')).toBe(true)
          done()
        })
        .catch(done)
    })
  })
})
