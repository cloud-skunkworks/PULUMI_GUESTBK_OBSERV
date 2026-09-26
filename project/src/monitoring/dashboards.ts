
import * as fs from "fs";
import * as path from "path";
import * as k8s from "@pulumi/kubernetes";
import { GuestbookMonitoringConfig } from "../config";
import { appLabels } from "../namespaces";
import { PrometheusStack } from "./prometheus";

export interface Dashboards {
    guestbookDashboard?: k8s.core.v1.ConfigMap;
}

export function createDashboards(
    config: GuestbookMonitoringConfig,
    monitoringNamespaceName: string,
    stack: PrometheusStack,
): Dashboards {
    if (!config.enableDashboard) {
        return {};
    }

    const dashboardPath = path.join(__dirname, "..", "..", "dashboards", "guestbook-dashboard.json");
    const dashboardJson = fs.readFileSync(dashboardPath, "utf8").replaceAll("__APP_NAMESPACE__", config.appNamespace);

    const guestbookDashboard = new k8s.core.v1.ConfigMap(
        "guestbook-dashboard",
        {
            metadata: {
                name: "guestbook-dashboard",
                namespace: monitoringNamespaceName,
                labels: {
                    ...appLabels("guestbook", "grafana-dashboard"),
                    grafana_dashboard: "1",
                },
                annotations: {
                    "grafana_folder": "Guestbook",
                },
            },
            data: {
                "guestbook-dashboard.json": dashboardJson,
            },
        },
        { dependsOn: [stack.chart] },
    );

    return { guestbookDashboard };
}
