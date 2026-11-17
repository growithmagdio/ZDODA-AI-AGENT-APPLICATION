// Bundles the functions into apps/functions/dist with a deploy-ready package.json.
// Workspace packages (@zdoda/shared) are inlined; npm dependencies stay external.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const out = join(root, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [join(root, 'src/index.ts')],
  outfile: join(out, 'index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external: Object.keys(pkg.dependencies),
  banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
  logLevel: 'info',
});

writeFileSync(
  join(out, 'package.json'),
  JSON.stringify(
    { name: 'zdoda-functions', private: true, type: 'module', main: 'index.js', engines: { node: '22' }, dependencies: pkg.dependencies },
    null,
    2
  )
);
// Firebase loads .env / .env.<projectId> from the functions source dir.
for (const f of readdirSync(root)) if (/^\.env(\.[\w-]+)?$/.test(f) && f !== '.env.example') copyFileSync(join(root, f), join(out, f));
console.log('functions bundle ready → apps/functions/dist');
