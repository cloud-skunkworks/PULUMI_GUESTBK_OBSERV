import * as k8s from "@pulumi/kubernetes";
import { GuestbookMonitoringConfig } from "../config";
import { FRONTEND_SELECTOR_LABELS } from "../guestbook/frontend";
import { METRICS_CONTAINER_PORT } from "../guestbook/metrics";

export interface NetworkPolicies { enabled: boolean; }

/** App namespace ingress isolation. Monitoring chart egress is not isolated here. */
export function createNetworkPolicies(
    config: GuestbookMonitoringConfig,
    appNamespaceName: string,
    monitoringNamespaceName: string,
    appNamespace: k8s.core.v1.Namespace,
    monitoringNamespace: k8s.core.v1.Namespace,
): NetworkPolicies {
    if (!config.enableNetworkPolicies) return { enabled: false };
    const policy = (name: string, spec: k8s.types.input.networking.v1.NetworkPolicySpec) =>
        new k8s.networking.v1.NetworkPolicy(name, {
            metadata: { name, namespace: appNamespaceName }, spec,
        }, { dependsOn: [appNamespace, monitoringNamespace] });

    policy("guestbook-default-deny-ingress", { podSelector: {}, policyTypes: ["Ingress"] });
    policy("guestbook-allow-prometheus-scrape", {
        podSelector: { matchLabels: FRONTEND_SELECTOR_LABELS }, policyTypes: ["Ingress"],
        ingress: [{
            from: [{
                namespaceSelector: { matchLabels: { "kubernetes.io/metadata.name": monitoringNamespaceName } },
                podSelector: { matchLabels: { "app.kubernetes.io/name": "prometheus" } },
            }],
            ports: [{ protocol: "TCP", port: METRICS_CONTAINER_PORT }],
        }],
    });
    // Both frontend access and replica synchronization need Redis ingress.
    policy("guestbook-allow-redis-ingress", {
        podSelector: { matchLabels: { "app.kubernetes.io/name": "redis" } }, policyTypes: ["Ingress"],
        ingress: [{
            from: [
                { podSelector: { matchLabels: FRONTEND_SELECTOR_LABELS } },
                { podSelector: { matchLabels: { "app.kubernetes.io/name": "redis", "app.kubernetes.io/component": "replica" } } },
            ],
            ports: [{ protocol: "TCP", port: 6379 }],
        }],
    });
    policy("guestbook-allow-frontend-to-redis", {
        podSelector: { matchLabels: FRONTEND_SELECTOR_LABELS }, policyTypes: ["Egress"],
        egress: [
            { to: [{ podSelector: { matchLabels: { "app.kubernetes.io/name": "redis" } } }], ports: [{ protocol: "TCP", port: 6379 }] },
            // DNS service addresses differ by CNI; restrict to the approved resolver in production.
            { ports: [{ protocol: "UDP", port: 53 }, { protocol: "TCP", port: 53 }] },
        ],
    });
    return { enabled: true };
}
