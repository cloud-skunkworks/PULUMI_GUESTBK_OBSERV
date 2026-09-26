import * as pulumi from "@pulumi/pulumi";
import { Settings, resolveSettings } from "./settings";

export type GrafanaServiceType = Settings["grafanaServiceType"];
export interface GuestbookMonitoringConfig extends Settings {
    grafanaAdminPassword: pulumi.Output<string>;
}

/** Read config once; keep validation independent of Pulumi for offline tests. */
export function loadConfig(): GuestbookMonitoringConfig {
    const c = new pulumi.Config();
    return {
        ...resolveSettings({
            appNamespace: c.get("appNamespace"),
            monitoringNamespace: c.get("monitoringNamespace"),
            cloudProvider: c.get("cloudProvider"),
            grafanaServiceType: c.get("grafanaServiceType"),
            grafanaAdminUser: c.get("grafanaAdminUser"),
            prometheusChartVersion: c.get("prometheusChartVersion"),
            frontendImage: c.get("frontendImage"),
            redisImage: c.get("redisImage"),
            enableDashboard: c.getBoolean("enableDashboard") ?? c.getBoolean("enableGrafanaDashboard"),
            enableServiceMonitor: c.getBoolean("enableServiceMonitor"),
            enableNetworkPolicies: c.getBoolean("enableNetworkPolicies"),
            enableRbac: c.getBoolean("enableRbac"),
            enableNodeExporter: c.getBoolean("enableNodeExporter"),
            allowExternalGrafana: c.getBoolean("allowExternalGrafana"),
            grafanaServiceAnnotations: c.getObject<Record<string, string>>("grafanaServiceAnnotations"),
        }),
        grafanaAdminPassword: c.requireSecret("grafanaAdminPassword"),
    };
}
