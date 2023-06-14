# msw-integration-layer

[`MSW`](https://mswjs.io/) integration layer for usage with [`@web/dev-server`](https://modern-web.dev/docs/dev-server/overview/), [`@web/test-runner`](https://modern-web.dev/docs/test-runner/overview/) and [`@web/dev-server-storybook`](https://modern-web.dev/docs/dev-server/plugins/storybook/#mainjs-and-previewjs).

## Defining mocks

`feature-a/demo/mocks.js`:
```js
import { rest } from 'msw-integration-layer/rest.js';
 
/**
 * Define mock scenarios
 */
export default {
  /**
   * Return an object from the handler
   */
  default: [
    rest.get('/api/foo', (context) => Response.json({foo: 'bar'}))
  ],
  /**
   * Return native `Response` object from the handler
   */
  error: [
    rest.get('/api/foo', (context) => new Response('', {status: 400}))
  ],
  /**
   * Handle additional custom logic in the handler, based on url, searchparams, whatever
   */
  custom: [
    rest.get('/api/users', ({request}) => {
      if(request.url.searchParams.get('user') === '123') {
        return Response.json({ id: '123', name: 'frank' });
      }
   
      return Response.json({ id: '456', name: 'bob' });
    }),
    rest.get('/api/users/:id', ({request}) => {
      if(request.params.id === '123') {
        return new Response('', {status: 400});
      }
 
      return Response.json({ id: '456', name: 'bob' });
    })
  ],
  /**
   * Provide an async fn, a fn returning an object, a fn returning a Response, or just an object
   */
  returnValues: [
    rest.get('/api/foo', async (context) => Response.json({foo: 'bar'})),
    rest.get('/api/foo', async (context) => new Response(JSON.stringify({foo: 'bar'}), {status: 200})),
    rest.get('/api/foo', (context) => Response.json({foo: 'bar'})),
    rest.get('/api/foo', (context) => new Response(JSON.stringify({foo: 'bar'}), {status: 200})),
  ]
}
```

## `@web/dev-server`/`@web/dev-server-storybook`

`feature-a/web-dev-server.config.mjs`:
```js
import { storybookPlugin } from '@web/dev-server-storybook';
import { mockPlugin } from 'msw-integration-layer/node.js';

export default {
  nodeResolve: true,
  plugins: [
    mockPlugin(),
    storybookPlugin({ type: 'web-components' }),
  ],
};
```

You can also add the `mswRollupPlugin` to your `.storybook/main.cjs` config for when you're bundling your Storybook to deploy somewhere; your mocks will be deployed along with your Storybook, and will work in whatever environment you deploy them to.

`feature-a/.storybook/main.cjs`:
```js
module.exports = {
  stories: ['../stories/**/*.stories.{js,md,mdx}'],
  rollupConfig: async config => {
    const { mswRollupPlugin } = await import('msw-integration-layer/node.js');
    config.plugins.push(mswRollupPlugin());
    return config;
  },
};
```

`feature-a/stories/default.stories.js`:
```js
import { html } from 'lit';
import mocks from '../demo/mocks.js';

export const Default = () => html`<feature-a></feature-a>`;
Default.story = {
  parameters: {
    mocks: mocks.default,
    // or
    mocks: [
      mocks.default,
      otherMocks.error,
      rest.get('/api/bar', () => Response.json({bar: 'bar'})),
      rest.post('/api/baz', () => new Response('', {status: 400})),
    ],
    // or
    mocks: [
      rest.get('/api/users/:id', ({request}) => {
        if (request.params.id === '123') {
          return Response.json({name: 'frank'});
        }
        return Response.json({name: 'bob'});
      })
    ],
  },
};
```

## `@web/test-runner`

The `registerMockRoutes` function will ensure the service worker is installed, and the `mockPlugin` takes care of resolving the service worker file, so users don't have to keep this one-time generated service worker file in their own project roots.

`feature-a/web-test-runner.config.mjs`:
```js
import { mockPlugin } from 'msw-integration-layer/node.js';

export default {
  nodeResolve: true,
  files: ['test/**/*.test.js'],
  plugins: [
    mockPlugin(),
  ],
};
```
`feature-a/test/my-test.test.js`:

```js
import { registerMockRoutes, rest } from 'msw-integration-layer';
import mocks from '../demo/mocks.js';
import mocks as featureBmocks from 'feature-b/demo/mocks.js';
 
describe('feature-a', () => {
  it('works', async () => {
    registerMockRoutes(rest.get('/api/foo', () => Response.json({foo: 'foo'})));

    const response = await fetch('/api/foo').then(r => r.json());
    expect(response.foo).to.equal('foo');
  });

  it('works', () => {
    registerMockRoutes(
      // Current project's mocks
      mocks.default, // is an array, arrays get flattened in the integration layer
 
      // Third party project's mocks, that uses a different version of MSW internally
      featureBmocks.default,
 
      // Additional mocks
      rest.get('/api/baz', (context) => Response.json({baz: 'baz'}))
    )
  });
});
```

## Rationale

### Why not use MSW directly?

Large applications may have many features, that themself may depend on other features internally. Consider the following example:

`feature-a` uses `feature-b` internally. `feature-a` wants to reuse the mocks of `feature-b`, but the versions of msw are different.

- `feature-a` uses `msw@1.0.0`
- `feature-b` uses `msw@2.0.0`

```js
import { mocks } from '../demo/mocks.js';
import { mocks as featureBmocks } from 'feature-b/demo/mocks.js';
 
const Default = () => html`<feature-a></feature-a>`; // uses `feature-b` internally
Default.story = {
  parameters: {
    mocks: [
      mocks.default, // uses MSW@1.0.0
      featureBmocks.default // ❌ uses MSW@2.0.0, incompatible mocks -> MSW@2.0.0 may expect a different service worker, or different API!
    ]
  }
}
```

`msw@2.0.0` may have a different API or it's service worker may expect a different message, event, or data format. In order to ensure forward compatibility, we expose a "middleman" function:

```js
import { rest } from 'msw-integration-layer/rest.js';

rest.get('/api/foo', ({request}) => Response.json({foo: 'bar'}));
```

The middleware function simply returns an object that looks like:

```js
{
  method: 'get',
  endpoint: '/api/foo',
  handler: ({request}) => Response.json({foo: 'bar'})
}
```

This way we can support multiple versions of `msw` inside of our integration layer by acting as a bridge of sorts; the function people define mocks with doesn't directly depend on `msw` itself, it just creates an object with the information we need to pass on to msw.

That way, `feature-a`'s project controls the dependency on `msw` (via the msw integration layer package), while still being able to use mocks from other projects that may use a different version of `msw` themself internally.

In the wrapper, we standardize on native `Request` and `Response` objects; the handler function receives a `Request` object, and returns a `Response` object. This means that the wrapper function only depends on standard, browser-native JS, and itself has no other dependencies, which is a good foundation to ensure forward compatibility.

### Requests/Responses

The `Request` and `Response` objects used are standard JS `Request` and `Response` objects. You can read more about them on MDN.
