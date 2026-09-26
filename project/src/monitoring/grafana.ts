
import * as pulumi from "@pulumi/pulumi";
import { GuestbookMonitoringConfig } from "../config";
import { describeGrafanaAccess, PrometheusStack } from "./prometheus";

export interface GrafanaAccess {
    url: pulumi.Output<string>;
    accessHint: pulumi.Output<string>;
    nodePort: pulumi.Output<string>;
    serviceType: string;
    serviceName: string;
    namespaceName: string;
}

export function createGrafanaAccess(
    config: GuestbookMonitoringConfig,
    stack: PrometheusStack,
): GrafanaAccess {
    const url = describeGrafanaAccess(stack, config.grafanaServiceType);

    return {
        url,
        accessHint: url.apply(
            (resolved) =>
                `${resolved} (fallback: kubectl port-forward -n ${stack.monitoringNamespaceName} svc/${stack.grafanaServiceName} 3000:80 then open http://localhost:3000)`,
        ),
        nodePort: url.apply((resolved) => {
            const match = resolved.match(/<any-node-ip>:(\d+)/);
            return match?.[1] ?? "";
        }),
        serviceType: config.grafanaServiceType,
        serviceName: stack.grafanaServiceName,
        namespaceName: stack.monitoringNamespaceName,
    };
}
