import { readFileSync } from 'node:fs';
import { fileURLToPath} from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = process.cwd()

export function mockPlugin() {
  return {
    name: 'ing-mocks',
    serve(context) {
      if (context.request.url === '/__msw_sw__.js') {
        const serviceWorkerPath = path.resolve(__dirname, './mockServiceWorker.js')
        return readFileSync(serviceWorkerPath, 'utf8');
      }
    },
  };
}
