const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { start } = require('../generated/server.cjs');
async function unusedPort() {
  const s = net.createServer();
  await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
  const port = s.address().port;
  await new Promise(resolve => s.close(resolve));
  return port;
}
test('bundled OTel app exports actual requests, errors, duration; probes and scrapes are excluded', async t => {
  const metricsPort = await unusedPort();
  const app = await start({ appPort: 0, metricsPort, host: '127.0.0.1' });
  t.after(() => app.close());
  const url = 'http://127.0.0.1:' + app.server.address().port;
  const metricsUrl = 'http://127.0.0.1:' + metricsPort + '/metrics';
  const read = async () => (await fetch(metricsUrl)).text();
  const metric = (body, name) => Number(body.match(new RegExp('^' + name + '(?:\\{[^}]*\\})? ([0-9.]+)$', 'm'))?.[1]);
  await fetch(url + '/healthz');
  await read();
  assert.equal(metric(await read(), 'guestbook_http_requests_total'), 0);
  assert.equal((await fetch(url + '/')).status, 200);
  assert.equal((await fetch(url + '/error')).status, 500);
  assert.equal((await fetch(url + '/unknown')).status, 404);
  const body = await read();
  assert.equal(metric(body, 'guestbook_http_requests_total'), 3);
  assert.equal(metric(body, 'guestbook_http_request_errors_total'), 1);
  assert.equal(metric(body, 'guestbook_http_request_duration_seconds_count'), 3);
});
