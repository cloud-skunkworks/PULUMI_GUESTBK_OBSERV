import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const compiler = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc'], { stdio: 'inherit' });
if (compiler.error) throw compiler.error;
if (compiler.status !== 0) process.exit(compiler.status ?? 1);
mkdirSync('generated', { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['./app/server.cjs'], outfile: 'generated/server.cjs',
  bundle: true, platform: 'node', target: 'node24', format: 'cjs',
  minify: true, legalComments: 'inline',
});
if (readFileSync('generated/server.cjs').length > 900000)
  throw new Error('Frontend bundle exceeds Kubernetes ConfigMap size budget');
console.log('Built Pulumi JavaScript and standalone OpenTelemetry frontend.');
