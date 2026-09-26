'use strict';

// Metrics demo, not a Redis-backed guestbook. No URL, body, or PII attributes.
const http = require('node:http');
const { MeterProvider } = require('@opentelemetry/sdk-metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

async function start({ appPort = 8080, metricsPort = 9464, host = '0.0.0.0' } = {}) {
  const exporter = new PrometheusExporter({ port: metricsPort, host, preventServerStart: true, withoutTargetInfo: true });
  const provider = new MeterProvider({ readers: [exporter] });
  const meter = provider.getMeter('guestbook-frontend');
  const requests = meter.createCounter('guestbook_http_requests');
  const errors = meter.createCounter('guestbook_http_request_errors');
  const latency = meter.createHistogram('guestbook_http_request_duration_seconds', {
    unit: 's', description: 'HTTP response duration in seconds',
    advice: { explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] },
  });
  requests.add(0);
  errors.add(0);

  const server = http.createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }
    const started = process.hrtime.bigint();
    const status = req.url === '/error' ? 500 : req.url === '/' ? 200 : 404;
    res.once('finish', () => {
      requests.add(1);
      if (status >= 500) errors.add(1);
      latency.record(Number(process.hrtime.bigint() - started) / 1e9);
    });
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(status === 200
      ? '<h1>Guestbook monitoring demo</h1><p>OpenTelemetry metrics use the internal metrics port.</p>'
      : status === 500 ? 'simulated error' : 'not found');
  });
  await exporter.startServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(appPort, host, resolve);
  }).catch(async error => { await provider.shutdown(); throw error; });
  return {
    server,
    close: async () => {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await provider.shutdown();
    },
  };
}

if (require.main === module) {
  start({ appPort: Number(process.env.APP_PORT || 8080), metricsPort: Number(process.env.METRICS_PORT || 9464) })
    .then(app => {
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
        app.close().then(() => process.exit(0), () => process.exit(1));
        setTimeout(() => process.exit(1), 10000).unref();
      });
    })
    .catch(() => { console.error('Frontend startup failed'); process.exitCode = 1; });
}
module.exports = { start };
