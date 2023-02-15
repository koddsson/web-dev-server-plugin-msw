import { readFileSync } from 'node:fs';
import { fileURLToPath} from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = process.cwd()

export function mockPlugin(filename, options = {}) {
  const script = `<script type="module">
    import '${path.resolve(rootDir, filename)}';
  </script>`

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
            `${script}
            </head>`,
          ),
        };
      }
      return undefined;
    },
  };
}
