import { readFileSync } from 'node:fs';
import { fileURLToPath} from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// TODO: Clean this up a lot and work on the API. I'm thinking that it should have sane defaults.
// {
//    '/user': 'koddsson'
// }
//
// Then it's possible to do more complicated things:
//
// {
//   '/user': new Response('{"username": "koddsson"}),
// }
//
// I wonder if we can make `Request` objects be the keys on the object.
// 
// {
//   [new Request('/user', {method: 'POST'})]: new Response('{"username": "koddsson"}),
// }
//
// Then matching requests might be super easy.
export function mockPlugin(givenHandlers, options = {}) {
  const {quiet = true} = options

  const handlers = []

  givenHandlers.forEach(async (response, request) => {
    const body = await response.text()
    const pathname = new URL(request.url).pathname
    const verb = ['GET', 'POST'].includes(request.method) ? request.method.toLowerCase() : 'get'
    handlers.push(`rest.${verb}('${pathname}', (req, res, ctx) => {
      return res(ctx.status(${response.status || 200}), ctx.set(${JSON.stringify(Object.fromEntries(response.headers))}), ctx.body(\`${body}\`))
    })`)
  })
  return {
    name: 'ing-mocks',
    serve(context) {
      if (context.request.url === '/mockServiceWorker.js') {
        const serviceWorkerPath = path.resolve(__dirname, './mockServiceWorker.js')
        return readFileSync(serviceWorkerPath, 'utf8');
      }
    },
    async transform(context) {
      if (context.response.is('html')) {
        return {
          body: context.body.replace(
            /<\/head>/,
            `<script type="module">
                import { rest, setupWorker } from '@bundled-es-modules/msw';

                const handlers = [${await Promise.all(handlers)}];
                const worker = setupWorker(...handlers);

                worker.start({
                  quiet: ${quiet},
                  // See https://github.com/mswjs/msw/discussions/1231#discussioncomment-2729999 if you'd like to warn if there's a unhandled request
                  onUnhandledRequest() {
                    return undefined;
                  },
                });
              </script>
            </head>`,
          ),
        };
      }
      return undefined;
    },
  };
}
