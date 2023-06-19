import fs from 'node:fs';
import path from 'node:path';
import * as url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export function mswRollupPlugin() {
  return {
    name: 'rollup-plugin-msw',
    writeBundle(opts) {
      const sw = fs.readFileSync(path.join(__dirname, './mockServiceWorker.js'), 'utf8');
      const outPath = path.join(opts.dir, '__msw_sw__.js');
      fs.writeFileSync(outPath, sw);
    }
  }
}
