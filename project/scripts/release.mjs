import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { zipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const top = ['README.md', 'BUILD-BOOK.md', 'SECURITY.md', 'CHANGELOG.md', 'NOTICE.md',
  'package.json', 'package-lock.json', 'tsconfig.json', 'Pulumi.yaml',
  'Pulumi.dev.yaml.example', 'versions.json', '.gitignore', '.nvmrc'];
const directories = ['src', 'app', 'scripts', 'tests', 'dashboards', 'docs', 'runbook', 'lib', 'generated'];
const allowed = /\.(?:ts|cjs|mjs|js|json|md|ps1|sh)$/;
const sha256 = data => createHash('sha256').update(data).digest('hex');
const files = new Map();
function add(relative, explicit = false) {
  const absolute = path.join(root, relative);
  const stat = lstatSync(absolute);
  if (stat.isSymbolicLink()) throw new Error('Release refuses symlinks: ' + relative);
  if (stat.isDirectory()) {
    for (const name of readdirSync(absolute).sort()) add(relative + '/' + name);
    return;
  }
  if (!explicit && (!allowed.test(relative) || relative.split('/').some(part => part.startsWith('.') || part === 'node_modules' || part === 'release'))) return;
  // Text normalization makes checkout line-ending differences irrelevant.
  const bytes = Buffer.from(readFileSync(absolute, 'utf8').replace(/\r\n/g, '\n'));
  files.set(relative, bytes);
}
for (const name of top) add(name, true);
for (const name of directories) add(name);
const manifest = Object.fromEntries([...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, bytes]) => [name, sha256(bytes)]));
files.set('MANIFEST.sha256.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
const stamp = new Date(2000, 0, 1, 0, 0, 0);
function archive(selected, prefix) {
  const entries = {};
  for (const [name, bytes] of [...selected].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
    entries[prefix + '/' + name] = [bytes, { mtime: stamp }];
  return zipSync(entries, { level: 9 });
}
const output = path.join(root, 'release');
mkdirSync(output, { recursive: true });
const artifacts = {
  '4iRDemo.zip': archive(files, 'pulumi-k8s-guestbook-monitoring'),
  '4iRDemo-DevOps-SRE-Runbook.zip': archive(
    [...files].filter(([name]) => name.startsWith('runbook/')).map(([name, bytes]) => [name.slice(8), bytes]), 'runbook'),
};
let checksums = '';
for (const [name, bytes] of Object.entries(artifacts)) {
  writeFileSync(path.join(output, name), bytes);
  checksums += sha256(bytes) + '  ' + name + '\n';
}
writeFileSync(path.join(output, 'SHA256SUMS.txt'), checksums);
console.log('Built release/ ZIPs and SHA256SUMS.txt (no deployment performed).');
