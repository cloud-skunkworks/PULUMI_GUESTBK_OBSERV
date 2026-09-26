const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { unzipSync } = require('fflate');
const root = path.join(__dirname, '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
test('ZIPs are deterministic, self-contained, and exclude state/cache paths', () => {
  function build() {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/release.mjs')], { cwd: __dirname, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return ['4iRDemo.zip', '4iRDemo-DevOps-SRE-Runbook.zip'].map(name => readFileSync(path.join(root, 'release', name)));
  }
  const first = build(), second = build();
  assert.deepEqual(first.map(hash), second.map(hash));
  const contents = unzipSync(first[0]);
  const prefix = 'pulumi-k8s-guestbook-monitoring/';
  const manifest = JSON.parse(Buffer.from(contents[prefix + 'MANIFEST.sha256.json']));
  for (const [name, expected] of Object.entries(manifest))
    assert.equal(hash(contents[prefix + name]), expected, name);
  for (const name of ['README.md', 'BUILD-BOOK.md', 'package-lock.json', 'lib/index.js', 'generated/server.cjs', 'scripts/release.mjs', 'runbook/OPERATIONS.md'])
    assert.ok(contents[prefix + name], name);
  assert.ok(!Object.keys(contents).some(name => /node_modules|\.env|\.npm-cache|Pulumi\.dev\.yaml$|\.pulumi/.test(name)));
  const runbook = unzipSync(first[1]);
  assert.ok(runbook['runbook/README.md']);
  assert.ok(runbook['runbook/BUILD-BOOK.md']);
});
