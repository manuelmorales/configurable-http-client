# Configurable HTTP Client

Configurable HTTP Client is a `fetch` wrapper that allows configuring it's
options and callbacks with a fluid interface:

```javascript
import httpClient from 'http-client'

const client = httpClient
  .requestOptions({credentials: 'same-origin'})
  .onError(() => { throw "there was an error" })
  .onStatus(401, () => { redirectToLogin() })

client.runRequest('http://example.com')
  .then((resp) => { console.log(resp))
```

The main **use case** this was created for is to allow defining some of the
behavior at an application level and not to force that responsibility to
the caller.


## Example of use case

In our case, we had a set of libraries in charge of making calls to the server
that we call _repositories_.

```javascript
const commentsRepository = {
  find: async id => {
    const response = await fetch(
      `/comments/${id}.json`,
      {credentials: 'same-origin'}
    )

    if (response.status === 401) { document.location.assign('/logout') }
    if (!response.ok) { throw `Error ${response.status}` }

    return (await response.json())
  }
}

export default commentsRepository
```

There is some behavior in the `commentsRepository` that would be better defined
as a default at an application level:

* `{credentials: 'same-origin'}` will always be there.
* Redirect to `/logout` on 401.
* Throw error when status is not 2XX.

With this library, these behaviors can be defined at an application level:

```javascript
import client from 'http-client'

const configuredClient = httpClient
  .requestOptions({credentials: 'same-origin'})
  .onError(() => { throw `Error ${response.status}` })
  .onStatus(401, () => { document.location.assign('/logout') })
}

export default configuredClient
```


```javascript
import configuredClient from 'configuredClient'

const commentsRepository = {
  find: async id => {
    const response = await configuredClient.runRequest(`/comments/${id}.json`)
    return (await response.json())
  }
}

export default commentsRepository
```

As you can see this allowed moving responsibilities around.
Although similar behavior could be achieved by providing a wrapper function
around `fetch` that uses `then()` to redirect in case of being logged out,
with this library we can override behaviors at any point:


```javascript
import configuredClient from 'configuredClient'

const currentUserRepository = {
  find: async id => {
    const user = await configuredClient
      .onStatus(401, () => { return null }) # <= We override the 401 behavior
      .onStatus(200, (resp) => { return await resp.json() })
      .runRequest(`/current_user.json`)
    return user
  }
}

export default currentUserRepository
```

## Usage

You can first register some callbacks and then run the request with
 **runRequest**, which receives the same arguments than `fetch()` and
will return a promise:

```javascript
httpClient
  .onStatus(401, () => { document.location.assign('/logout') })
  .runRequest('/')
  .then((response) => { console.log(response) })
```

You can accumulate the following callbacks:

* **onResponse(callback)**: Will be called if there is a response from the server.
* **onSuccess(callback)**: Will be called if there is a 2XX response from the server.
* **onError(callback)**: Will be called if there is a non 2XX response from the server.
* **onStatus(statusCode, callback)**: Will be called if there is a response from the server with that specific status code.

In case of conflict, only the most specific callback will be called.
In case of receiving a 401, `onStatus(401, c)` takes precedence over
`onError(c)` which takes precedence over `onResponse(c)`.

Callbacks can be overwritten:

```javascript
httpClient
  .onStatus(401, () => { throw 'A 401!!!' })
  .onStatus(401, () => { console.log('A 401') }) # Only this one will be executed in case of 401
  .runRequest('/')
```

This also allows to clear an already existing callback passing `null`:

```javascript
httpClient
  .onStatus(401, () => { throw 'A 401!!!' })
  .onStatus(401, null) # Clears the callback above
  .runRequest('/')
```

By default, it will use `global.fetch`, but a different one can be set:

```javascript
const fetchMock = require('fetch-mock')

httpClient
  .fetch(fetchMock)
  .runRequest('/')
```

It is possible to define the request before the callbacks using **request()**
and **run()** separately. This can improve readability:


```javascript
httpClient
  .request('/')
  .onStatus(200, () => { console.log('Success!') })
  .onStatus(422, () => { console.log('Validation Error!') })
  .run()
```


It is possible to declare some options with **requestOptions()**.
Those will be merged with the ones given to the request:

```javascript
httpClient
  .requestOptions({credentials: 'same-origin'})
  .runRequest('/', {method: 'POST'})
  # Will result into fetch('/', {credentials: 'same-origin', method: 'POST'})
```

For convenience it also accepts a **json_body** option that will also set
the `Content-Type` headers correctly:

```javascript
httpClient.runRequest('/post', { method: 'POST', json_body: {a: 1} })
```

