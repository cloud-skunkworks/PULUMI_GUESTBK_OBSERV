
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { GuestbookMonitoringConfig, GrafanaServiceType } from "../config";

export const HELM_RELEASE_NAME = "kps";
export const GRAFANA_SERVICE_NAME = `${HELM_RELEASE_NAME}-grafana`;
export const PROMETHEUS_SERVICE_NAME = "prometheus-operated";
export const RELEASE_LABEL = HELM_RELEASE_NAME;

export interface PrometheusStack {
    chart: k8s.helm.v3.Chart;
    prometheusServiceName: string;
    grafanaServiceName: string;
    releaseLabel: string;
    monitoringNamespaceName: string;
}

export interface PrometheusStackArgs {
    config: GuestbookMonitoringConfig;
    monitoringNamespaceName: string;
    monitoringNamespaceDependency: k8s.core.v1.Namespace;
    enableDashboardSidecar: boolean;
}

function grafanaServiceTypeValue(t: GrafanaServiceType): string {
    return t; // values are already valid k8s service types
}

export function monitoringValues(args: PrometheusStackArgs) {
    const { config } = args;

    return {
        grafana: {
            adminUser: config.grafanaAdminUser,
            adminPassword: config.grafanaAdminPassword,
            service: {
                type: grafanaServiceTypeValue(config.grafanaServiceType),
                annotations: config.grafanaServiceAnnotations,
            },
            sidecar: {
                dashboards: {
                    enabled: args.enableDashboardSidecar,
                    searchNamespace: args.monitoringNamespaceName,
                    label: "grafana_dashboard",
                    labelValue: "1",
                },
            },
            resources: {
                requests: { cpu: "100m", memory: "128Mi" },
                limits: { cpu: "500m", memory: "512Mi" },
            },
        },

        prometheus: {
            prometheusSpec: {
                serviceMonitorSelectorNilUsesHelmValues: false,
                podMonitorSelectorNilUsesHelmValues: false,
                serviceMonitorSelector: { matchLabels: { release: HELM_RELEASE_NAME } },
                serviceMonitorNamespaceSelector: { matchLabels: { "kubernetes.io/metadata.name": args.monitoringNamespaceName } },
                podMonitorSelector: { matchLabels: { release: HELM_RELEASE_NAME } },
                podMonitorNamespaceSelector: { matchLabels: { "kubernetes.io/metadata.name": args.monitoringNamespaceName } },
                retention: "6h",
                resources: {
                    requests: { cpu: "150m", memory: "512Mi" },
                    limits: { cpu: "1", memory: "1Gi" },
                },
            },
        },

        kubeEtcd: { enabled: false },
        kubeScheduler: { enabled: false },
        kubeControllerManager: { enabled: false },
        kubeProxy: { enabled: false },
        nodeExporter: { enabled: config.enableNodeExporter },
    };

}

export function createPrometheusStack(args: PrometheusStackArgs): PrometheusStack {
    const { config } = args;
    const values = monitoringValues(args);
    const chart = new k8s.helm.v3.Chart(
        HELM_RELEASE_NAME,
        {
            chart: "kube-prometheus-stack",
            version: config.prometheusChartVersion,
            namespace: args.monitoringNamespaceName,
            fetchOpts: {
                repo: "https://prometheus-community.github.io/helm-charts",
            },
            values,
        },
        { dependsOn: [args.monitoringNamespaceDependency] },
    );

    return {
        chart,
        prometheusServiceName: PROMETHEUS_SERVICE_NAME,
        grafanaServiceName: GRAFANA_SERVICE_NAME,
        releaseLabel: RELEASE_LABEL,
        monitoringNamespaceName: args.monitoringNamespaceName,
    };
}

export function describeGrafanaAccess(
    stack: PrometheusStack,
    serviceType: GrafanaServiceType,
): pulumi.Output<string> {
    const ns = stack.monitoringNamespaceName;
    const svc = stack.grafanaServiceName;

    if (serviceType === "LoadBalancer") {
        const live = k8s.core.v1.Service.get(`${svc}-lookup`, pulumi.interpolate`${ns}/${svc}`, {
            dependsOn: [stack.chart],
        });
        return live.status.apply((status) => {
            const ing = status?.loadBalancer?.ingress?.[0];
            const addr = ing?.ip ?? ing?.hostname;
            if (addr) {
                return `http://${addr}:80`;
            }
            return (
                `LoadBalancer EXTERNAL-IP pending. Use port-forward instead: ` +
                `kubectl port-forward -n ${ns} svc/${svc} 3000:80  then open http://localhost:3000`
            );
        });
    }

    if (serviceType === "NodePort") {
        const live = k8s.core.v1.Service.get(`${svc}-lookup`, pulumi.interpolate`${ns}/${svc}`, {
            dependsOn: [stack.chart],
        });
        return live.spec.apply((spec) => {
            const np = spec?.ports?.find((p) => p.name === "http-web" || p.port === 80)?.nodePort;
            const portText = np ? `${np}` : "<assigned-node-port>";
            return (
                `NodePort: http://<any-node-ip>:${portText}  ` +
                `(fallback: kubectl port-forward -n ${ns} svc/${svc} 3000:80 -> http://localhost:3000)`
            );
        });
    }

    return pulumi.output(
        `ClusterIP (not externally exposed). Access via: ` +
            `kubectl port-forward -n ${ns} svc/${svc} 3000:80  then open http://localhost:3000`,
    );
}
