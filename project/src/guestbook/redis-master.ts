
import * as k8s from "@pulumi/kubernetes";
import { appLabels } from "../namespaces";

export interface RedisMaster {
    deployment: k8s.apps.v1.Deployment;
    service: k8s.core.v1.Service;
    serviceName: string;
}

export function createRedisMaster(
    namespaceName: string,
    namespaceDependency: k8s.core.v1.Namespace,
    image: string,
): RedisMaster {
    const labels = appLabels("redis", "master");
    const name = "redis-master";

    const deployment = new k8s.apps.v1.Deployment(
        name,
        {
            metadata: { name, namespace: namespaceName, labels },
            spec: {
                replicas: 1,
                selector: { matchLabels: labels },
                template: {
                    metadata: { labels },
                    spec: {
                        automountServiceAccountToken: false,
                        nodeSelector: { "kubernetes.io/os": "linux" },
                        containers: [
                            {
                                name: "redis-master",
                                image,
                                ports: [{ name: "redis", containerPort: 6379 }],
                                resources: {
                                    requests: { cpu: "50m", memory: "64Mi" },
                                    limits: { cpu: "250m", memory: "128Mi" },
                                },
                                readinessProbe: {
                                    tcpSocket: { port: "redis" },
                                    initialDelaySeconds: 5,
                                    periodSeconds: 10,
                                },
                                livenessProbe: {
                                    tcpSocket: { port: "redis" },
                                    initialDelaySeconds: 15,
                                    periodSeconds: 20,
                                },
                            },
                        ],
                    },
                },
            },
        },
        { dependsOn: [namespaceDependency] },
    );

    const service = new k8s.core.v1.Service(
        name,
        {
            metadata: { name, namespace: namespaceName, labels },
            spec: {
                type: "ClusterIP",
                ports: [{ name: "redis", port: 6379, targetPort: "redis" }],
                selector: labels,
            },
        },
        { dependsOn: [namespaceDependency] },
    );

    return { deployment, service, serviceName: name };
}
