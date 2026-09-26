
import * as k8s from "@pulumi/kubernetes";
import { Frontend } from "../guestbook/frontend";
import { appLabels } from "../namespaces";
import { PrometheusStack } from "./prometheus";

export interface ServiceMonitors {
    guestbookFrontend?: k8s.apiextensions.CustomResource;
}

export function createServiceMonitors(
    appNamespaceName: string,
    monitoringNamespaceName: string,
    frontend: Frontend,
    stack: PrometheusStack,
): ServiceMonitors {
    const guestbookFrontend = new k8s.apiextensions.CustomResource(
        "guestbook-frontend-servicemonitor",
        {
            apiVersion: "monitoring.coreos.com/v1",
            kind: "ServiceMonitor",
            metadata: {
                name: "guestbook-frontend",
                namespace: monitoringNamespaceName,
                labels: {
                    ...appLabels("guestbook", "servicemonitor"),
                    release: stack.releaseLabel,
                },
            },
            spec: {
                namespaceSelector: {
                    matchNames: [appNamespaceName],
                },
                selector: {
                    matchLabels: frontend.selectorLabels,
                },
                endpoints: [
                    {
                        port: frontend.metricsPortName,
                        path: "/metrics",
                        interval: "15s",
                        scrapeTimeout: "10s",
                    },
                ],
            },
        },
        { dependsOn: [stack.chart, frontend.service] },
    );

    return { guestbookFrontend };
}
