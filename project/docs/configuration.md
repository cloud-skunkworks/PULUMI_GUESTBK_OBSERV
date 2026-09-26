# Configuration Reference

Defaults are defined in src/settings.ts; runtime pins come from versions.json. Kubernetes context/provider options use the standard Pulumi Kubernetes provider configuration, including `pulumi config set kubernetes:context <context-name>`. Never commit raw kubeconfig.

| Key | Default | Meaning |
|---|---|---|
| cloudProvider | local | local / aws / azure / gcp; platform label, not cluster provisioning |
| appNamespace | guestbook | App namespace; distinct DNS label |
| monitoringNamespace | monitoring | Monitoring namespace; distinct DNS label |
| grafanaServiceType | ClusterIP | ClusterIP / NodePort / LoadBalancer |
| allowExternalGrafana | false | Required opt-in for NodePort or LoadBalancer |
| grafanaServiceAnnotations | {} | Reviewed cloud-specific service annotations |
| grafanaAdminUser | admin | Initial admin user |
| grafanaAdminPassword | required secret | Set interactively using pulumi config set --secret |
| prometheusChartVersion | versions.json | Exact kube-prometheus-stack chart version |
| frontendImage | versions.json | Versioned Node 24 image or approved mirror/digest |
| redisImage | versions.json | Versioned Redis image or approved mirror/digest |
| enableNetworkPolicies | true | App ingress policy and frontend egress restriction |
| enableDashboard | true | Provision Guestbook Overview |
| enableGrafanaDashboard | alias | Used only if enableDashboard is unset |
| enableServiceMonitor | true | Create the frontend scrape target |
| enableRbac | true | Dedicated frontend service account and empty role |
| enableNodeExporter | true | Disable where host-level exporter is forbidden |

Images with no explicit tag or with :latest are rejected. Version tags remain mutable; use approved digests for production.

For private load balancers, configure the platform's required annotations through grafanaServiceAnnotations and verify the resulting service before use. Annotations are not inferred from cloudProvider. This avoids silently assuming networking conventions.

Defaults deliberately use no persistent volume claim or storage class. The existing cluster supplies scheduling, DNS, CNI, image access, and admission. Ingress creation is not implemented; use private port forwarding or an approved separately managed ingress.

Outputs include appNamespace, monitoringNamespace, cloudProvider, guestbookFrontendService, guestbookFrontendUrl, guestbookMetricsPath, redisMasterService, redisReplicaService, prometheusServiceName, prometheusAccessHint, serviceMonitorName, grafanaServiceName, grafanaServiceType, grafanaUrl, grafanaAccessHint, grafanaNodePort, grafanaAdminUser, grafanaAdminPassword (secret), dashboardProvisioned, and networkPoliciesEnabled. Access outputs can be instructions rather than a URL when no externally routable endpoint exists.
