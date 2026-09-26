const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveSettings } = require('../lib/settings');
test('all platforms retain private defaults and custom namespaces', () => {
  for (const cloudProvider of ['local', 'aws', 'azure', 'gcp']) {
    const c = resolveSettings({ cloudProvider, appNamespace: 'payments-demo', monitoringNamespace: 'observability' });
    assert.equal(c.grafanaServiceType, 'ClusterIP');
    assert.equal(c.enableNetworkPolicies, true);
    assert.equal(c.appNamespace, 'payments-demo');
  }
});
test('configuration rejects unsafe or invalid inputs', () => {
  for (const input of [
    { cloudProvider: 'oops' }, { grafanaServiceType: 'oops' },
    { grafanaServiceType: 'LoadBalancer' }, { grafanaServiceType: 'NodePort' },
    { appNamespace: 'UPPER' }, { appNamespace: 'x', monitoringNamespace: 'x' },
    { frontendImage: 'node:latest' }, { redisImage: 'redis' },
  ]) assert.throws(() => resolveSettings(input));
  assert.equal(resolveSettings({ grafanaServiceType: 'LoadBalancer', allowExternalGrafana: true }).grafanaServiceType, 'LoadBalancer');
});
