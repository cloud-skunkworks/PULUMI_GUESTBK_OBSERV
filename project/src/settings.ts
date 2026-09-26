import { readFileSync } from "node:fs";
import { join } from "node:path";

const versions = JSON.parse(readFileSync(join(__dirname, "..", "versions.json"), "utf8"));
export interface Settings {
    appNamespace: string;
    monitoringNamespace: string;
    cloudProvider: "local" | "aws" | "azure" | "gcp";
    grafanaServiceType: "ClusterIP" | "LoadBalancer" | "NodePort";
    grafanaAdminUser: string;
    prometheusChartVersion: string;
    frontendImage: string;
    redisImage: string;
    enableDashboard: boolean;
    enableServiceMonitor: boolean;
    enableNetworkPolicies: boolean;
    enableRbac: boolean;
    enableNodeExporter: boolean;
    allowExternalGrafana: boolean;
    grafanaServiceAnnotations: Record<string, string>;
}
type Input = Partial<Omit<Settings, "cloudProvider" | "grafanaServiceType">> & {
    cloudProvider?: string;
    grafanaServiceType?: string;
};

export function resolveSettings(input: Input): Settings {
    const cloudProvider = input.cloudProvider ?? "local";
    const grafanaServiceType = input.grafanaServiceType ?? "ClusterIP";
    if (!["local", "aws", "azure", "gcp"].includes(cloudProvider))
        throw new Error("cloudProvider must be local, aws, azure, or gcp");
    if (!["ClusterIP", "LoadBalancer", "NodePort"].includes(grafanaServiceType))
        throw new Error("grafanaServiceType must be ClusterIP, LoadBalancer, or NodePort");
    const appNamespace = input.appNamespace ?? "guestbook";
    const monitoringNamespace = input.monitoringNamespace ?? "monitoring";
    for (const name of [appNamespace, monitoringNamespace]) {
        if (name.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name))
            throw new Error("Namespaces must be DNS labels of at most 63 characters");
    }
    if (appNamespace === monitoringNamespace) throw new Error("Namespaces must be separate");
    if (grafanaServiceType !== "ClusterIP" && !input.allowExternalGrafana)
        throw new Error("External Grafana requires allowExternalGrafana=true after review");
    const frontendImage: string = input.frontendImage ?? versions.frontendImage;
    const redisImage: string = input.redisImage ?? versions.redisImage;
    for (const image of [frontendImage, redisImage]) {
        if (!/(?:@sha256:[a-f0-9]{64}|:[^/:]+)$/.test(image) || image.endsWith(":latest"))
            throw new Error("Images require a version tag or sha256 digest; latest is forbidden");
    }
    return {
        appNamespace, monitoringNamespace,
        cloudProvider: cloudProvider as Settings["cloudProvider"],
        grafanaServiceType: grafanaServiceType as Settings["grafanaServiceType"],
        grafanaAdminUser: input.grafanaAdminUser ?? "admin",
        prometheusChartVersion: input.prometheusChartVersion ?? versions.prometheusChart,
        frontendImage, redisImage,
        enableDashboard: input.enableDashboard ?? true,
        enableServiceMonitor: input.enableServiceMonitor ?? true,
        enableNetworkPolicies: input.enableNetworkPolicies ?? true,
        enableRbac: input.enableRbac ?? true,
        enableNodeExporter: input.enableNodeExporter ?? true,
        allowExternalGrafana: input.allowExternalGrafana ?? false,
        grafanaServiceAnnotations: input.grafanaServiceAnnotations ?? {},
    };
}
