import { readFileSync } from 'node:fs';
import { fileURLToPath} from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function mockPlugin(handlers, options = {}) {
  const {quiet = true} = options

  handlers = Object.entries(handlers).flatMap(async ([path, response]) => {
    if (response instanceof Response) {
      const body = await response.text()
      return `rest.get('${path}', (req, res, ctx) => {
        return res(ctx.status(${response.status || 200}), ctx.set(${JSON.stringify(Object.fromEntries(response.headers))}), ctx.body(\`${body}\`))
      })`
    } else {
      return Promise.all(Object.entries(response).flatMap(async ([verb, actualResponse]) => {
        const body = await actualResponse.text()
        // TODO, right now we just support POST and GET
        if (verb === 'GET') {
          return `rest.get('${path}', (req, res, ctx) => {
            return res(ctx.status(${actualResponse.status || 200}), ctx.set(${JSON.stringify(Object.fromEntries(actualResponse.headers))}), ctx.body(\`${body}\`))
          })`
        } else if (verb === 'POST') {
          return `rest.post('${path}', (req, res, ctx) => {
            return res(ctx.status(${actualResponse.status || 200}), ctx.set(${JSON.stringify(Object.fromEntries(actualResponse.headers))}), ctx.body(\`${body}\`))
          })`
        } else {
          throw new Error(`Unsupported verb ${verb} encountered`)
        }
      }))
    }
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
