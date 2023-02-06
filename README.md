# @koddsson/web-dev-server-plugin-msw

A [Web Dev Server](https://modern-web.dev/docs/dev-server/overview/) plugin to mock HTTP requests using the [Mock Service Worker](https://mswjs.io/).

## Usage

```sh
npm install --save-dev @koddsson/web-dev-server-plugin-msw
```

```
import mockPlugin from '@koddsson/web-dev-server-plugin-msw';

export default {
  ...config,
  plugins: [
    mockPlugin({
      '/api/user/koddsson': new Response('{"cool": true}')
    })
  ]
}
```
