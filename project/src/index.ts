
import { loadConfig } from "./config";
import { createNamespaces } from "./namespaces";
import { createFrontendRbac } from "./security/rbac";
import { createNetworkPolicies } from "./security/network-policies";
import { createGuestbook } from "./guestbook";
import { createMonitoring } from "./monitoring";
import { buildOutputs } from "./outputs";

const config = loadConfig();
const namespaces = createNamespaces(config);

const frontendRbac = createFrontendRbac(
    config,
    namespaces.appNamespaceName,
    namespaces.appNamespace,
);

const guestbook = createGuestbook({
    config,
    namespaceName: namespaces.appNamespaceName,
    namespaceDependency: namespaces.appNamespace,
    frontendServiceAccountName: frontendRbac.serviceAccountName,
});

const networkPolicies = createNetworkPolicies(
    config,
    namespaces.appNamespaceName,
    namespaces.monitoringNamespaceName,
    namespaces.appNamespace,
    namespaces.monitoringNamespace,
);

const monitoring = createMonitoring({
    config,
    appNamespaceName: namespaces.appNamespaceName,
    monitoringNamespaceName: namespaces.monitoringNamespaceName,
    monitoringNamespaceDependency: namespaces.monitoringNamespace,
    frontend: guestbook.frontend,
});

const outputs = buildOutputs({ config, namespaces, guestbook, monitoring, networkPolicies });

export const appNamespace = outputs.appNamespace;
export const monitoringNamespace = outputs.monitoringNamespace;
export const cloudProvider = outputs.cloudProvider;
export const guestbookFrontendService = outputs.guestbookFrontendService;
export const guestbookFrontendUrl = outputs.guestbookFrontendUrl;
export const guestbookMetricsPath = outputs.guestbookMetricsPath;
export const redisMasterService = outputs.redisMasterService;
export const redisReplicaService = outputs.redisReplicaService;
export const prometheusService = outputs.prometheusService;
export const prometheusServiceName = outputs.prometheusServiceName;
export const prometheusAccessHint = outputs.prometheusAccessHint;
export const serviceMonitorName = outputs.serviceMonitorName;
export const grafanaService = outputs.grafanaService;
export const grafanaServiceName = outputs.grafanaServiceName;
export const grafanaServiceType = outputs.grafanaServiceType;
export const grafanaUrl = outputs.grafanaUrl;
export const grafanaAccessHint = outputs.grafanaAccessHint;
export const grafanaNodePort = outputs.grafanaNodePort;
export const grafanaAdminUser = outputs.grafanaAdminUser;
export const grafanaAdminPassword = outputs.grafanaAdminPassword;
export const dashboardProvisioned = outputs.dashboardProvisioned;
export const networkPoliciesEnabled = outputs.networkPoliciesEnabled;
