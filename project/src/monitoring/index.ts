
import * as k8s from "@pulumi/kubernetes";
import { GuestbookMonitoringConfig } from "../config";
import { Frontend } from "../guestbook/frontend";
import { createPrometheusStack, PrometheusStack } from "./prometheus";
import { createServiceMonitors, ServiceMonitors } from "./service-monitors";
import { createDashboards, Dashboards } from "./dashboards";
import { createGrafanaAccess, GrafanaAccess } from "./grafana";

export interface Monitoring {
    stack: PrometheusStack;
    serviceMonitors: ServiceMonitors;
    dashboards: Dashboards;
    grafana: GrafanaAccess;
}

export function createMonitoring(args: {
    config: GuestbookMonitoringConfig;
    appNamespaceName: string;
    monitoringNamespaceName: string;
    monitoringNamespaceDependency: k8s.core.v1.Namespace;
    frontend: Frontend;
}): Monitoring {
    const stack = createPrometheusStack({
        config: args.config,
        monitoringNamespaceName: args.monitoringNamespaceName,
        monitoringNamespaceDependency: args.monitoringNamespaceDependency,
        enableDashboardSidecar: args.config.enableDashboard,
    });

    const serviceMonitors = args.config.enableServiceMonitor ? createServiceMonitors(
        args.appNamespaceName,
        args.monitoringNamespaceName,
        args.frontend,
        stack,
    ) : {};

    const dashboards = createDashboards(args.config, args.monitoringNamespaceName, stack);
    const grafana = createGrafanaAccess(args.config, stack);

    return { stack, serviceMonitors, dashboards, grafana };
}
