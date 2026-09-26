// Cross-platform live validation. Start localhost port-forwards before running.
import { spawnSync } from 'node:child_process';
const options = { 'app-namespace': 'guestbook', 'monitoring-namespace': 'monitoring' };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, '');
  if (!(key in options) || !args[i + 1]) throw new Error('Unknown or missing option: ' + args[i]);
  options[key] = args[i + 1];
}
const app = options['app-namespace'];
const monitoring = options['monitoring-namespace'];
for (const name of [app, monitoring]) {
  if (name.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name)) throw new Error('Invalid namespace');
}
function kubectl(args) {
  const result = spawnSync('kubectl', args, { encoding: 'utf8', timeout: 30000 });
  if (result.error || result.status !== 0) throw new Error('kubectl failed: ' + args.join(' '));
  return result.stdout;
}
async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('HTTP check failed: ' + response.status);
  return response.json();
}
async function count() {
  const query = 'sum(guestbook_http_requests_total{namespace="' + app + '",service="guestbook-frontend"})';
  const response = await json('http://127.0.0.1:9090/api/v1/query?query=' + encodeURIComponent(query));
  if (response.status !== 'success' || !response.data.result.length) throw new Error('Request metric absent');
  const value = Number(response.data.result[0].value[1]);
  if (!Number.isFinite(value)) throw new Error('Request metric is not numeric');
  return value;
}
try {
  console.log('Context: ' + kubectl(['config', 'current-context']).trim());
  for (const name of ['guestbook-frontend', 'redis-master', 'redis-replica'])
    kubectl(['-n', app, 'rollout', 'status', 'deployment/' + name, '--timeout=20s']);
  const monitor = JSON.parse(kubectl(['-n', monitoring, 'get', 'servicemonitor', 'guestbook-frontend', '-o', 'json']));
  const service = JSON.parse(kubectl(['-n', app, 'get', 'service', 'guestbook-frontend', '-o', 'json']));
  if (!monitor.spec.namespaceSelector.matchNames.includes(app)) throw new Error('Monitor namespace mismatch');
  for (const [key, value] of Object.entries(monitor.spec.selector.matchLabels))
    if (service.metadata.labels[key] !== value) throw new Error('Monitor/service label mismatch');
  const targets = await json('http://127.0.0.1:9090/api/v1/targets');
  const matched = targets.data.activeTargets.filter(t => t.labels.namespace === app && t.labels.service === 'guestbook-frontend');
  if (!matched.length || matched.some(t => t.health !== 'up')) throw new Error('Frontend targets missing or down');
  const before = await count();
  for (let i = 0; i < 10; i++) {
    const response = await fetch('http://127.0.0.1:8080/', { signal: AbortSignal.timeout(10000) });
    if (response.status !== 200) throw new Error('Frontend request failed');
    await response.text();
  }
  let increased = false;
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    if (await count() > before) { increased = true; break; }
  }
  if (!increased) throw new Error('Request count did not increase after traffic');
  console.log('PASS: ready app deployments, monitor selectors, UP targets, and request counter growth.');
  console.log('Complete Grafana, image scan, and policy enforcement checks manually using runbook/VALIDATION.md.');
} catch (error) {
  console.error('FAIL: ' + error.message);
  process.exitCode = 1;
}
