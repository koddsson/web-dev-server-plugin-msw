import fs from 'node:fs';

export default function mswRollupPlugin() {
  return {
    name: 'rollup-plugin-msw',
    writeBundle(opts) {
      const sw = fs.readFileSync('./mockServiceWorker.js', 'utf8');
      const outPath = path.join(opts.dir, '__msw_sw__.js');
      fs.writeFileSync(outPath, sw);
    }
  }
}
