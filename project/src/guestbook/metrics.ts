import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import * as k8s from "@pulumi/kubernetes";
import { appLabels } from "../namespaces";

export const APP_CONTAINER_PORT = 8080;
export const METRICS_CONTAINER_PORT = 9464;
export interface MetricsConfigMap {
    configMap: k8s.core.v1.ConfigMap;
    configMapName: string;
    serverFileName: string;
    appContainerPort: number;
    checksum: string;
}

/** Bundle OTel at build time; pods need no npm access or custom image registry. */
export function createMetricsConfigMap(namespaceName: string, namespace: k8s.core.v1.Namespace): MetricsConfigMap {
    const source = readFileSync(join(__dirname, "..", "..", "generated", "server.cjs"), "utf8");
    if (Buffer.byteLength(source) > 900_000) throw new Error("Frontend exceeds ConfigMap size budget");
    const configMapName = "guestbook-frontend-server";
    const serverFileName = "server.cjs";
    const configMap = new k8s.core.v1.ConfigMap(configMapName, {
        metadata: { name: configMapName, namespace: namespaceName, labels: appLabels("guestbook", "frontend") },
        data: { [serverFileName]: source },
    }, { dependsOn: [namespace] });
    return {
        configMap, configMapName, serverFileName, appContainerPort: APP_CONTAINER_PORT,
        checksum: createHash("sha256").update(source).digest("hex"),
    };
}
