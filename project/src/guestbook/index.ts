
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { GuestbookMonitoringConfig } from "../config";
import { createMetricsConfigMap } from "./metrics";
import { createFrontend, Frontend } from "./frontend";
import { createRedisMaster } from "./redis-master";
import { createRedisReplica } from "./redis-replica";

export interface GuestbookArgs {
    config: GuestbookMonitoringConfig;
    namespaceName: string;
    namespaceDependency: k8s.core.v1.Namespace;
    frontendServiceAccountName?: pulumi.Input<string>;
}

export interface Guestbook {
    frontend: Frontend;
    redisMasterServiceName: string;
    redisReplicaServiceName: string;
    namespaceName: string;
}

export function createGuestbook(args: GuestbookArgs): Guestbook {
    const metrics = createMetricsConfigMap(args.namespaceName, args.namespaceDependency);

    const redisMaster = createRedisMaster(args.namespaceName, args.namespaceDependency, args.config.redisImage);
    const redisReplica = createRedisReplica(
        args.namespaceName,
        args.namespaceDependency,
        redisMaster.serviceName,
        args.config.redisImage,
    );

    const frontend = createFrontend({
        namespaceName: args.namespaceName,
        namespaceDependency: args.namespaceDependency,
        metrics,
        serviceAccountName: args.frontendServiceAccountName,
        image: args.config.frontendImage,
    });

    return {
        frontend,
        redisMasterServiceName: redisMaster.serviceName,
        redisReplicaServiceName: redisReplica.serviceName,
        namespaceName: args.namespaceName,
    };
}
