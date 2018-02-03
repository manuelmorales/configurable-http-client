const httpClient = require('./httpClient')

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
})
