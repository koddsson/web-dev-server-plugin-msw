import { readFileSync } from 'node:fs';
import { fileURLToPath} from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function mockPlugin(handlers, options = {}) {
  const {quiet = true} = options

  handlers = Object.entries(handlers).map(async ([path, response]) => {
    const body = await response.text()
    return `rest.get('${path}', (req, res, ctx) => {
      return res(ctx.status(${response.statusCode || 200}), ctx.set(${JSON.stringify(Object.fromEntries(response.headers))}), ctx.body(\`${body}\`))
    })`
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
