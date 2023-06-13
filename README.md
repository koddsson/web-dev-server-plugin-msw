# msw-integration-layer

## Usage in the browser

### Define your mock scenarios

`my-feature/demo/mocks.js`:
```js
import { rest } from 'msw-integration-layer/rest.js';

export default {
  default: [
    rest.post('/api/bar', () => Response.json({bar: 'bar'})),
    rest.get('/api/foo', () => Response.json({foo: 'foo'}))
  ],
  error: [
    rest.post('/api/bar', () => new Response('', {status: 400})),
    rest.get('/api/foo', () => new Response('', {status: 400}))
  ]
};
```

### Storybook

`my-feature/stories/default.stories.js`:
```js
import { html } from 'lit';
import mocks from '../demo/mocks.js';

export const Default = () => html`<my-feature></my-feature>`;
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

    // or
    mocks: [
      {
        method: 'get',
        endpoint: '/api/bar',
        handler: () => Response.json({bar: 'bar'})
      }
    ]
  },
};
```

### Unit tests

`my-feature/tests/my-feature.test.js`:
```js
import { registerMockRoutes } from 'msw-integration-layer/browser.js';
import { expect } from '@open-wc/testing';
import mocks from '../demo/mocks.js';

describe('my-feature', () => {
  it('works', async () => {
    // See the storybook example for more ways of passing mocks
    registerMockRoutes(mocks.default);

    const response = await fetch('/api/foo').then(r => r.json());
    expect(response.foo).to.equal('foo');
  });
})
```

### Requests/responses

The `Request` and `Response` objects used are standard JS `Request` and `Response` objects. You can read more about them on MDN.
