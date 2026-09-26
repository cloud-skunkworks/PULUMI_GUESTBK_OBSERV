
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { appLabels } from "../namespaces";
import { GuestbookMonitoringConfig } from "../config";

export interface FrontendRbac {
    serviceAccountName?: pulumi.Input<string>;
}

export function createFrontendRbac(
    config: GuestbookMonitoringConfig,
    namespaceName: string,
    namespaceDependency: k8s.core.v1.Namespace,
): FrontendRbac {
    if (!config.enableRbac) {
        return { serviceAccountName: undefined };
    }

    const labels = appLabels("guestbook", "frontend");
    const saName = "guestbook-frontend";

    const serviceAccount = new k8s.core.v1.ServiceAccount(
        "guestbook-frontend-sa",
        {
            metadata: { name: saName, namespace: namespaceName, labels },
            automountServiceAccountToken: false,
        },
        { dependsOn: [namespaceDependency] },
    );

    const role = new k8s.rbac.v1.Role(
        "guestbook-frontend-role",
        {
            metadata: { name: saName, namespace: namespaceName, labels },
            rules: [],
        },
        { dependsOn: [namespaceDependency] },
    );

    new k8s.rbac.v1.RoleBinding(
        "guestbook-frontend-rolebinding",
        {
            metadata: { name: saName, namespace: namespaceName, labels },
            roleRef: { apiGroup: "rbac.authorization.k8s.io", kind: "Role", name: saName },
            subjects: [
                { kind: "ServiceAccount", name: saName, namespace: namespaceName },
            ],
        },
        { dependsOn: [serviceAccount, role] },
    );

    return { serviceAccountName: serviceAccount.metadata.name };
}
