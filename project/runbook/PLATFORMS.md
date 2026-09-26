# Platform Build Book

## Shared prerequisites

Use an existing supported Kubernetes cluster with Linux worker nodes. The pinned chart declares Kubernetes >=1.25; this is a chart minimum, not a recommendation to operate an obsolete cluster. Select an actively supported cluster version approved by your platform team.

Allow capacity for the Prometheus Operator, Prometheus, Grafana, kube-state-metrics, optional node exporter, two frontend pods, and three Redis pods. Confirm node capacity and actual rendered resource requests before deployment.

The workstation needs Node 24.21.0, npm, Pulumi CLI 3.264.0, Helm 3.22.0 for chart rendering, kubectl, and the relevant cloud identity plugin. Pod identities do not require cloud credentials for this demo. The deployment identity needs reviewed CRD/cluster RBAC permissions for the chart.

Use an approved Pulumi state backend/secrets provider. Verify the selected kube context and stack on every deployment. Do not combine resources from multiple stacks in the same fixed namespaces.

## Local Kubernetes / Docker Desktop

Enable Kubernetes and Linux containers. Select the intended context and confirm Ready nodes. ClusterIP and localhost port forwarding need no load-balancer implementation.

```text
kubectl config use-context docker-desktop
kubectl get nodes
pulumi config set cloudProvider local
```

Network policies are only enforced if the local CNI supports them. Record this limitation explicitly. If node exporter cannot run under local policy, set enableNodeExporter false and record that host metrics are unavailable.

## Azure AKS

Use your approved user or workload identity. Connect to the existing cluster:

```text
az aks get-credentials --resource-group <resource-group> --name <cluster-name>
kubectl config current-context
kubectl get nodes
pulumi config set cloudProvider azure
```

Use kubelogin when required by the cluster authentication mode. Private clusters require network reachability from the workstation/runner. No AKS cluster, network, public IP, or role assignment is created by the Pulumi program.

## AWS EKS

Use an approved federated AWS session:

```text
aws eks update-kubeconfig --region <region> --name <cluster-name>
kubectl config current-context
kubectl get nodes
pulumi config set cloudProvider aws
```

Ensure EKS cluster access/RBAC admits the deployment identity. Use Linux node groups with appropriate capacity. A LoadBalancer service would depend on the cluster controller and network setup; the private default avoids that dependency.

## Google GKE

Authenticate using an approved identity and install gke-gcloud-auth-plugin when required:

```text
gcloud container clusters get-credentials <cluster-name> --region <region> --project <project-id>
kubectl config current-context
kubectl get nodes
pulumi config set cloudProvider gcp
```

For zonal clusters replace --region with --zone. GKE Autopilot or restrictive admission can reject host-level exporters; start with enableNodeExporter false, inspect the full chart preview, and validate admission. This package does not claim Autopilot certification.

## Exposure, registries, and storage

All targets default to private ClusterIP. For a reviewed internal LoadBalancer use the platform's current annotations through grafanaServiceAnnotations, explicitly opt in with allowExternalGrafana, and verify the resulting network path. Public access requires explicit organizational approval; do not infer it from cloudProvider.

Override frontendImage and redisImage to approved mirror/digest references if necessary. The chart also pulls monitoring images; mirror and scan those through your platform process. The default demo uses ephemeral storage and has no storage-class dependency.

## References

- [AKS cluster access](https://learn.microsoft.com/azure/aks/learn/quick-kubernetes-deploy-cli)
- [EKS kubeconfig](https://docs.aws.amazon.com/eks/latest/userguide/create-kubeconfig.html)
- [GKE cluster access](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl)
- [Monitoring chart](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
