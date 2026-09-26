
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { appLabels } from "../namespaces";
import { MetricsConfigMap, METRICS_CONTAINER_PORT } from "./metrics";

export const FRONTEND_SELECTOR_LABELS = appLabels("guestbook", "frontend");

export const FRONTEND_HTTP_PORT_NAME = "http";
export const FRONTEND_METRICS_PORT_NAME = "metrics";
export const FRONTEND_SERVICE_PORT = 80;

export interface Frontend {
    deployment: k8s.apps.v1.Deployment;
    service: k8s.core.v1.Service;
    serviceName: string;
    selectorLabels: { [key: string]: string };
    metricsPortName: string;
    namespaceName: string;
}

export interface FrontendArgs {
    image: string;
    namespaceName: string;
    namespaceDependency: k8s.core.v1.Namespace;
    metrics: MetricsConfigMap;
    serviceAccountName?: pulumi.Input<string>;
}

export function createFrontend(args: FrontendArgs): Frontend {
    const labels = FRONTEND_SELECTOR_LABELS;
    const name = "guestbook-frontend";
    const appPort = args.metrics.appContainerPort;

    const deployment = new k8s.apps.v1.Deployment(
        name,
        {
            metadata: { name, namespace: args.namespaceName, labels },
            spec: {
                replicas: 2,
                selector: { matchLabels: labels },
                template: {
                    metadata: { labels, annotations: { "checksum/server": args.metrics.checksum } },
                    spec: {
                        serviceAccountName: args.serviceAccountName,
                        automountServiceAccountToken: false,
                        nodeSelector: { "kubernetes.io/os": "linux" },
                        securityContext: { runAsNonRoot: true, runAsUser: 1000, runAsGroup: 1000, seccompProfile: { type: "RuntimeDefault" } },
                        volumes: [
                            {
                                name: "server",
                                configMap: { name: args.metrics.configMapName },
                            },
                        ],
                        containers: [
                            {
                                name: "frontend",
                                image: args.image,
                                securityContext: { allowPrivilegeEscalation: false, readOnlyRootFilesystem: true, capabilities: { drop: ["ALL"] } },
                                command: ["node", `/app/${args.metrics.serverFileName}`],
                                env: [{ name: "APP_PORT", value: `${appPort}` }, { name: "METRICS_PORT", value: `${METRICS_CONTAINER_PORT}` }],
                                volumeMounts: [
                                    { name: "server", mountPath: "/app", readOnly: true },
                                ],
                                ports: [
                                    { name: FRONTEND_HTTP_PORT_NAME, containerPort: appPort },
                                    { name: FRONTEND_METRICS_PORT_NAME, containerPort: METRICS_CONTAINER_PORT },
                                ],
                                resources: {
                                    requests: { cpu: "50m", memory: "64Mi" },
                                    limits: { cpu: "200m", memory: "128Mi" },
                                },
                                readinessProbe: {
                                    httpGet: { path: "/healthz", port: FRONTEND_HTTP_PORT_NAME },
                                    initialDelaySeconds: 5,
                                    periodSeconds: 10,
                                },
                                livenessProbe: {
                                    httpGet: { path: "/healthz", port: FRONTEND_HTTP_PORT_NAME },
                                    initialDelaySeconds: 10,
                                    periodSeconds: 20,
                                },
                            },
                        ],
                    },
                },
            },
        },
        { dependsOn: [args.namespaceDependency, args.metrics.configMap] },
    );

    const service = new k8s.core.v1.Service(
        name,
        {
            metadata: { name, namespace: args.namespaceName, labels },
            spec: {
                type: "ClusterIP",
                ports: [
                    {
                        name: FRONTEND_HTTP_PORT_NAME,
                        port: FRONTEND_SERVICE_PORT,
                        targetPort: FRONTEND_HTTP_PORT_NAME,
                    },
                    {
                        name: FRONTEND_METRICS_PORT_NAME,
                        port: METRICS_CONTAINER_PORT,
                        targetPort: FRONTEND_METRICS_PORT_NAME,
                    },
                ],
                selector: labels,
            },
        },
        { dependsOn: [args.namespaceDependency] },
    );

    return {
        deployment,
        service,
        serviceName: name,
        selectorLabels: labels,
        metricsPortName: FRONTEND_METRICS_PORT_NAME,
        namespaceName: args.namespaceName,
    };
}
