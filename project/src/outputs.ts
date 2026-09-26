
import { GuestbookMonitoringConfig } from "./config";
import { Guestbook } from "./guestbook";
import { Monitoring } from "./monitoring";
import { Namespaces } from "./namespaces";
import { NetworkPolicies } from "./security/network-policies";

export function buildOutputs(args: {
    config: GuestbookMonitoringConfig;
    namespaces: Namespaces;
    guestbook: Guestbook;
    monitoring: Monitoring;
    networkPolicies: NetworkPolicies;
}) {
    return {
        appNamespace: args.namespaces.appNamespaceName,
        monitoringNamespace: args.namespaces.monitoringNamespaceName,
        cloudProvider: args.config.cloudProvider,
        guestbookFrontendService: args.guestbook.frontend.serviceName,
        guestbookFrontendUrl: `kubectl port-forward -n ${args.guestbook.namespaceName} svc/${args.guestbook.frontend.serviceName} 8080:80 then open http://localhost:8080`,
        guestbookMetricsPath: "/metrics",
        redisMasterService: args.guestbook.redisMasterServiceName,
        redisReplicaService: args.guestbook.redisReplicaServiceName,
        prometheusService: args.monitoring.stack.prometheusServiceName,
        prometheusServiceName: args.monitoring.stack.prometheusServiceName,
        prometheusAccessHint: `kubectl port-forward -n ${args.monitoring.stack.monitoringNamespaceName} svc/${args.monitoring.stack.prometheusServiceName} 9090:9090 then open http://localhost:9090`,
        serviceMonitorName: args.config.enableServiceMonitor ? "guestbook-frontend" : "",
        grafanaService: args.monitoring.grafana.serviceName,
        grafanaServiceName: args.monitoring.grafana.serviceName,
        grafanaServiceType: args.monitoring.grafana.serviceType,
        grafanaUrl: args.monitoring.grafana.url,
        grafanaAccessHint: args.monitoring.grafana.accessHint,
        grafanaNodePort: args.monitoring.grafana.nodePort,
        grafanaAdminUser: args.config.grafanaAdminUser,
        grafanaAdminPassword: args.config.grafanaAdminPassword,
        dashboardProvisioned: Boolean(args.monitoring.dashboards.guestbookDashboard),
        networkPoliciesEnabled: args.networkPolicies.enabled,
    };
}
