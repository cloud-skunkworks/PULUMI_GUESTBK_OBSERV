
import * as k8s from "@pulumi/kubernetes";
import { GuestbookMonitoringConfig } from "./config";

export const PART_OF = "guestbook-monitoring";
export const MANAGED_BY = "pulumi";

export function appLabels(name: string, component: string): { [key: string]: string } {
    return {
        "app.kubernetes.io/name": name,
        "app.kubernetes.io/component": component,
        "app.kubernetes.io/part-of": PART_OF,
        "app.kubernetes.io/managed-by": MANAGED_BY,
    };
}

export interface Namespaces {
    appNamespace: k8s.core.v1.Namespace;
    monitoringNamespace: k8s.core.v1.Namespace;
    appNamespaceName: string;
    monitoringNamespaceName: string;
}

export function createNamespaces(config: GuestbookMonitoringConfig): Namespaces {
    const appNamespace = new k8s.core.v1.Namespace("app-namespace", {
        metadata: {
            name: config.appNamespace,
            labels: appLabels("guestbook", "namespace"),
        },
    });

    const monitoringNamespace = new k8s.core.v1.Namespace("monitoring-namespace", {
        metadata: {
            name: config.monitoringNamespace,
            labels: appLabels("monitoring", "namespace"),
        },
    });

    return {
        appNamespace,
        monitoringNamespace,
        appNamespaceName: config.appNamespace,
        monitoringNamespaceName: config.monitoringNamespace,
    };
}
