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
  .onStatus(401, () => { document.location.assign('/logout') }
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

