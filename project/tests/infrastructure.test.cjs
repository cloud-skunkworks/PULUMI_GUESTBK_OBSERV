const { test } = require('node:test');
const assert = require('node:assert/strict');
const pulumi = require('@pulumi/pulumi');
const resources = [];
pulumi.runtime.setMocks({
  newResource: args => {
    resources.push(args);
    return { id: args.name + '-id', state: args.inputs };
  },
  call: args => args.inputs,
}, 'guestbook-test', 'offline', false);
const { resolveSettings } = require('../lib/settings');
const { createNamespaces } = require('../lib/namespaces');
const { createGuestbook } = require('../lib/guestbook');
const { createServiceMonitors } = require('../lib/monitoring/service-monitors');
const { createDashboards } = require('../lib/monitoring/dashboards');
const { createNetworkPolicies } = require('../lib/security/network-policies');

test('custom namespaces keep service discovery, dashboards, and network policies connected', async () => {
  await pulumi.runtime.runInPulumiStack(async () => {
    const config = { ...resolveSettings({ appNamespace: 'demo-app', monitoringNamespace: 'demo-mon' }), grafanaAdminPassword: pulumi.secret('offline-test-only') };
    const ns = createNamespaces(config);
    const app = createGuestbook({ config, namespaceName: config.appNamespace, namespaceDependency: ns.appNamespace });
    const stack = { chart: new pulumi.ComponentResource('test:chart:Chart', 'chart'), releaseLabel: 'kps' };
    const monitors = createServiceMonitors(config.appNamespace, config.monitoringNamespace, app.frontend, stack);
    const dashboard = createDashboards(config, config.monitoringNamespace, stack);
    createNetworkPolicies(config, config.appNamespace, config.monitoringNamespace, ns.appNamespace, ns.monitoringNamespace);
    await Promise.all([app.frontend.service.urn.promise(), monitors.guestbookFrontend.urn.promise(), dashboard.guestbookDashboard.urn.promise()]);
  });
  const find = (type, name) => resources.find(r => r.type === type && r.name === name)?.inputs;
  const service = find('kubernetes:core/v1:Service', 'guestbook-frontend');
  const monitor = find('kubernetes:monitoring.coreos.com/v1:ServiceMonitor', 'guestbook-frontend-servicemonitor');
  assert.deepEqual(monitor.spec.selector.matchLabels, service.metadata.labels);
  assert.deepEqual(monitor.spec.namespaceSelector.matchNames, ['demo-app']);
  assert.equal(service.spec.ports.find(p => p.name === 'metrics').port, 9464);
  const dashboard = find('kubernetes:core/v1:ConfigMap', 'guestbook-dashboard');
  const json = dashboard.data['guestbook-dashboard.json'];
  assert.ok(json.includes('demo-app'));
  assert.ok(!json.includes('__APP_NAMESPACE__'));
  const policy = find('kubernetes:networking.k8s.io/v1:NetworkPolicy', 'guestbook-allow-redis-ingress');
  assert.equal(policy.spec.ingress[0].ports[0].port, 6379);
  assert.equal(policy.spec.ingress[0].from.length, 2);
  const deployment = find('kubernetes:apps/v1:Deployment', 'guestbook-frontend');
  assert.match(deployment.spec.template.metadata.annotations['checksum/server'], /^[a-f0-9]{64}$/);
  assert.equal(deployment.spec.template.spec.automountServiceAccountToken, false);
});

const { monitoringValues } = require('../lib/monitoring/prometheus');
test('monitoring values keep private services and namespace-scoped discovery', () => {
  const config = { ...resolveSettings({ monitoringNamespace: 'custom-mon', enableNodeExporter: false }), grafanaAdminPassword: pulumi.secret('offline-test-only') };
  const values = monitoringValues({ config, monitoringNamespaceName: 'custom-mon', enableDashboardSidecar: true });
  assert.equal(values.grafana.service.type, 'ClusterIP');
  assert.equal(values.grafana.sidecar.dashboards.searchNamespace, 'custom-mon');
  assert.equal(values.prometheus.prometheusSpec.serviceMonitorNamespaceSelector.matchLabels['kubernetes.io/metadata.name'], 'custom-mon');
  assert.equal(values.prometheus.prometheusSpec.serviceMonitorSelector.matchLabels.release, 'kps');
  assert.equal(values.nodeExporter.enabled, false);
});
