> RC2 implementation and current engineer books are in `project/`. This document preserves the original design requirements; see that project's CHANGELOG and architecture coverage for implemented behavior and gaps. RC2 defaults to private ClusterIP and uses a separate OpenTelemetry metrics port (9464).

# DevOps / SRE Runbook: Installing and Operating Guestbook Monitoring on AWS EKS, Azure AKS, and Google GKE

**Runbook name:** Guestbook Kubernetes Monitoring Runbook
**Audience:** DevOps Engineers, SREs, Platform Engineers, IT Managers, Cloud Operations Leads
**Cloud scope:** AWS EKS, Azure AKS, Google Kubernetes Engine
**Technology scope:** Pulumi, Kubernetes, Helm, Prometheus, Grafana, ServiceMonitor, OpenTelemetry-ready observability patterns
**Application scope:** Pulumi Kubernetes Guestbook application extended with Prometheus and Grafana monitoring
**Operational maturity target:** Release candidate, platform engineering proof of concept, or controlled non-production deployment
**Last updated:** 2026-06-01

---

## 1. Executive Summary for IT Managers

This runbook explains how to install, validate, operate, and troubleshoot a monitored Kubernetes Guestbook application across AWS, Azure, and Google Cloud.

The goal is to demonstrate that an implementation team or SRE team can:

1. Deploy the Guestbook application using Pulumi.
2. Deploy Prometheus and Grafana using Pulumi-managed Kubernetes resources or Helm charts.
3. Configure Prometheus to scrape Guestbook metrics.
4. Expose Grafana through a controlled service endpoint.
5. Verify that operational metrics are available for application and cluster health.
6. Provide repeatable run, rollback, and troubleshooting procedures.

This runbook is intentionally structured for auditability using TOGAF-style domains:

| TOGAF View | Runbook Focus |
|---|---|
| Business Architecture | Why monitoring is required, who owns it, service outcomes |
| Application Architecture | Guestbook frontend/backend and metrics endpoints |
| Data Architecture | Metrics, labels, retention, dashboards, alert data |
| Technology Architecture | Kubernetes, Pulumi, Prometheus, Grafana, cloud-specific access |
| Security Architecture | RBAC, secrets, Grafana credentials, namespace isolation |
| Operations Architecture | Install, verify, run, recover, troubleshoot, decommission |

---

## 2. Operating Principles

The monitored Guestbook deployment should follow these principles:

1. **Repeatable infrastructure:** All Kubernetes resources should be deployed through Pulumi rather than manual `kubectl apply` except for emergency break-glass actions.
2. **Modular design:** Separate application, monitoring, dashboard, and cloud-access configuration into clear modules.
3. **CNCF alignment:** Use Kubernetes-native primitives such as namespaces, services, labels, annotations, ServiceMonitor resources, and Helm charts.
4. **Least privilege:** Do not run broad cluster-admin access unless required for Prometheus Operator installation.
5. **Observable by default:** Every deploy should expose health, readiness, liveness, and metrics validation steps.
6. **Cloud portable:** Keep the monitoring stack as cloud-neutral as possible, with separate instructions for EKS, AKS, and GKE access.
7. **Human-operable:** Mid-level SREs should be able to run, verify, troubleshoot, and roll back the deployment from this document.

---

## 3. Roles and Responsibilities

| Role | Responsibilities |
|---|---|
| IT Manager | Approves cloud environment, cost envelope, access model, and acceptance criteria |
| Platform Lead | Owns Kubernetes cluster standards, RBAC, namespace patterns, and production readiness gate |
| DevOps / SRE Engineer | Executes deployment, validates metrics, configures dashboard, documents issues |
| Security Engineer | Reviews RBAC, secrets, public exposure, network access, and credential handling |
| Application Owner | Confirms Guestbook functionality and expected application metrics |

---

## 4. Target Architecture

### 4.1 Logical Architecture

```text
Developer / SRE Workstation
        |
        | pulumi up
        v
Pulumi Program
        |
        +--> Guestbook Namespace
        |       +--> Frontend Deployment / Service
        |       +--> Redis Leader Deployment / Service
        |       +--> Redis Replica Deployment / Service
        |       +--> Optional Metrics Endpoint / Sidecar / Exporter
        |
        +--> Monitoring Namespace
                +--> Prometheus Operator / kube-prometheus-stack
                +--> Prometheus
                +--> Grafana
                +--> ServiceMonitor / PodMonitor
                +--> Optional Grafana Dashboard ConfigMap
```

### 4.2 Cloud Deployment Models

| Cloud | Managed Kubernetes | Typical Access Command | Notes |
|---|---|---|---|
| AWS | Amazon EKS | `aws eks update-kubeconfig` | IAM-backed access, IRSA available for workload identity |
| Azure | Azure AKS | `az aks get-credentials` | Entra ID integration and workload identity available |
| Google | GKE | `gcloud container clusters get-credentials` | Workload Identity Federation available |

---

## 5. Prerequisites

### 5.1 Required Local Tools

Install the following tools on the SRE workstation or CI runner:

| Tool | Purpose | Validation Command |
|---|---|---|
| Pulumi CLI | Deploy infrastructure and Kubernetes resources | `pulumi version` |
| Node.js LTS | Run TypeScript Pulumi project | `node --version` |
| npm or pnpm | Install project dependencies | `npm --version` |
| kubectl | Interact with Kubernetes cluster | `kubectl version --client` |
| Helm CLI | Inspect Helm charts and releases | `helm version` |
| Cloud CLI | Authenticate to AWS, Azure, or Google | See cloud-specific sections |
| Git | Clone or manage repo | `git --version` |

### 5.2 Required Kubernetes Access

The operator needs permissions to:

1. Create namespaces.
2. Create deployments, services, config maps, and secrets.
3. Install Helm charts.
4. Install or manage Custom Resource Definitions if using Prometheus Operator.
5. Create ServiceMonitor or PodMonitor resources.
6. Create LoadBalancer or NodePort services for Grafana.

For a controlled release candidate or lab, cluster-admin may be acceptable. For enterprise environments, use a scoped platform-admin role and document the approval.

### 5.3 Required Cloud Access

| Cloud | Required Access |
|---|---|
| AWS | IAM permission to describe EKS cluster, update kubeconfig, and manage load balancer resources created by Kubernetes |
| Azure | Permission to access AKS cluster, retrieve credentials, and create public service endpoints if using LoadBalancer |
| Google | Permission to get GKE credentials and create Kubernetes services backed by Google Cloud load balancers |

---

## 6. Repository Layout

Use this layout for a modular, auditable submission.

```text
pulumi-k8s-guestbook-monitoring/
├── README.md
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── guestbook/
│   │   ├── namespace.ts
│   │   ├── frontend.ts
│   │   ├── redis-leader.ts
│   │   ├── redis-replica.ts
│   │   └── metrics.ts
│   ├── monitoring/
│   │   ├── namespace.ts
│   │   ├── prometheus-stack.ts
│   │   ├── servicemonitors.ts
│   │   ├── grafana-dashboard.ts
│   │   └── outputs.ts
│   └── security/
│       ├── rbac.ts
│       └── network-policy.ts
├── dashboards/
│   └── guestbook-overview.json
├── scripts/
│   ├── verify-aws.sh
│   ├── verify-azure.sh
│   ├── verify-gcp.sh
│   ├── verify-monitoring.sh
│   └── port-forward-grafana.sh
├── docs/
│   ├── architecture.md
│   ├── operations.md
│   ├── troubleshooting.md
│   └── security.md
└── runbooks/
    └── DEVOPS-SRE-K8S-MONITORING-RUNBOOK.md
```

---

## 7. Configuration Standards

### 7.1 Pulumi Stack Configuration

Recommended Pulumi config values:

```bash
pulumi config set cloudProvider aws      # aws | azure | gcp
pulumi config set guestbookNamespace guestbook
pulumi config set monitoringNamespace monitoring
pulumi config set grafanaServiceType LoadBalancer
pulumi config set grafanaAdminUser admin
pulumi config set --secret grafanaAdminPassword 'CHANGE-ME-STRONG-PASSWORD'
pulumi config set enableServiceMonitor true
pulumi config set enableGrafanaDashboard true
```

### 7.2 Recommended Namespaces

| Namespace | Purpose |
|---|---|
| `guestbook` | Application workloads |
| `monitoring` | Prometheus, Grafana, dashboards, ServiceMonitor resources |

### 7.3 Recommended Kubernetes Labels

Apply consistent labels to all resources:

```yaml
app.kubernetes.io/name: guestbook
app.kubernetes.io/part-of: pulumi-guestbook-monitoring
app.kubernetes.io/managed-by: pulumi
app.kubernetes.io/component: frontend
observability.platform.io/scrape: "true"
```

---

## 8. Cloud-Specific Setup

## 8.1 AWS EKS Setup

### 8.1.1 Validate AWS CLI Login

```bash
aws sts get-caller-identity
```

Expected result:

```json
{
  "UserId": "...",
  "Account": "...",
  "Arn": "..."
}
```

### 8.1.2 Configure kubectl for EKS

```bash
export AWS_REGION=us-east-1
export EKS_CLUSTER_NAME=guestbook-monitoring-eks

aws eks update-kubeconfig \
  --region "$AWS_REGION" \
  --name "$EKS_CLUSTER_NAME"
```

### 8.1.3 Verify Cluster Access

```bash
kubectl get nodes
kubectl get namespaces
```

### 8.1.4 Optional: Create a Lab EKS Cluster with eksctl

Use only if a cluster does not already exist.

```bash
cat > eks-cluster.yaml <<'YAML'
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: guestbook-monitoring-eks
  region: us-east-1
managedNodeGroups:
  - name: general
    instanceType: t3.large
    desiredCapacity: 2
    minSize: 2
    maxSize: 4
YAML

eksctl create cluster -f eks-cluster.yaml
```

### 8.1.5 AWS Notes for IT Managers

| Topic | Guidance |
|---|---|
| Cost | EKS control plane, worker nodes, load balancers, NAT gateways, and storage may incur cost |
| Security | Restrict public Grafana exposure; prefer internal LoadBalancer or port-forward for lab use |
| Identity | Use IAM and, for production, IRSA for workload identity |
| Cleanup | Delete LoadBalancer services before deleting cluster if cleanup gets stuck |

---

## 8.2 Azure AKS Setup

### 8.2.1 Validate Azure CLI Login

```bash
az account show --output table
```

If needed:

```bash
az login
az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"
```

### 8.2.2 Configure kubectl for AKS

```bash
export RESOURCE_GROUP=rg-guestbook-monitoring
export AKS_CLUSTER_NAME=guestbook-monitoring-aks

az aks get-credentials \
  --resource-group "$RESOURCE_GROUP" \
  --name "$AKS_CLUSTER_NAME" \
  --overwrite-existing
```

### 8.2.3 Verify Cluster Access

```bash
kubectl get nodes
kubectl get namespaces
```

### 8.2.4 Optional: Create a Lab AKS Cluster

```bash
export LOCATION=canadacentral
export RESOURCE_GROUP=rg-guestbook-monitoring
export AKS_CLUSTER_NAME=guestbook-monitoring-aks

az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"

az aks create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$AKS_CLUSTER_NAME" \
  --node-count 2 \
  --node-vm-size Standard_D2s_v5 \
  --generate-ssh-keys

az aks get-credentials \
  --resource-group "$RESOURCE_GROUP" \
  --name "$AKS_CLUSTER_NAME" \
  --overwrite-existing
```

### 8.2.5 Azure Notes for IT Managers

| Topic | Guidance |
|---|---|
| Cost | AKS worker nodes, load balancers, disks, public IPs, and log ingestion may incur cost |
| Security | Integrate with Entra ID for production; avoid long-lived shared admin credentials |
| Networking | Use private cluster or internal load balancer for enterprise environments |
| Cleanup | Delete resource group for lab cleanup only when it contains no shared assets |

---

## 8.3 Google GKE Setup

### 8.3.1 Validate Google Cloud CLI Login

```bash
gcloud auth list
gcloud config list project
```

If needed:

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
```

### 8.3.2 Configure kubectl for GKE

```bash
export PROJECT_ID=my-gcp-project
export REGION=us-central1
export GKE_CLUSTER_NAME=guestbook-monitoring-gke

gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID"
```

For zonal clusters, use:

```bash
gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" \
  --zone us-central1-a \
  --project "$PROJECT_ID"
```

### 8.3.3 Verify Cluster Access

```bash
kubectl get nodes
kubectl get namespaces
```

### 8.3.4 Optional: Create a Lab GKE Autopilot Cluster

```bash
export PROJECT_ID=my-gcp-project
export REGION=us-central1
export GKE_CLUSTER_NAME=guestbook-monitoring-gke

gcloud config set project "$PROJECT_ID"

gcloud container clusters create-auto "$GKE_CLUSTER_NAME" \
  --region "$REGION"

gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID"
```

### 8.3.5 Google Cloud Notes for IT Managers

| Topic | Guidance |
|---|---|
| Cost | GKE cluster management, workload resources, load balancers, and logging/monitoring may incur cost |
| Security | Use Google Cloud IAM and Workload Identity Federation for production patterns |
| Networking | Use internal load balancers or ingress controls for restricted environments |
| Cleanup | Confirm external IPs and disks are deleted after lab teardown |

---

## 9. Installation Procedure

The following procedure is cloud-neutral after `kubectl` is configured for the target cluster.

### 9.1 Clone the Repository

```bash
git clone <REPOSITORY_URL>
cd pulumi-k8s-guestbook-monitoring
```

### 9.2 Install Dependencies

```bash
npm install
```

### 9.3 Select or Create Pulumi Stack

```bash
pulumi stack select dev || pulumi stack init dev
```

### 9.4 Configure Deployment

Example for AWS:

```bash
pulumi config set cloudProvider aws
pulumi config set guestbookNamespace guestbook
pulumi config set monitoringNamespace monitoring
pulumi config set grafanaServiceType LoadBalancer
pulumi config set grafanaAdminUser admin
pulumi config set --secret grafanaAdminPassword 'CHANGE-ME-STRONG-PASSWORD'
pulumi config set enableServiceMonitor true
pulumi config set enableGrafanaDashboard true
```

Example for Azure:

```bash
pulumi config set cloudProvider azure
pulumi config set guestbookNamespace guestbook
pulumi config set monitoringNamespace monitoring
pulumi config set grafanaServiceType LoadBalancer
pulumi config set grafanaAdminUser admin
pulumi config set --secret grafanaAdminPassword 'CHANGE-ME-STRONG-PASSWORD'
pulumi config set enableServiceMonitor true
pulumi config set enableGrafanaDashboard true
```

Example for Google Cloud:

```bash
pulumi config set cloudProvider gcp
pulumi config set guestbookNamespace guestbook
pulumi config set monitoringNamespace monitoring
pulumi config set grafanaServiceType LoadBalancer
pulumi config set grafanaAdminUser admin
pulumi config set --secret grafanaAdminPassword 'CHANGE-ME-STRONG-PASSWORD'
pulumi config set enableServiceMonitor true
pulumi config set enableGrafanaDashboard true
```

### 9.5 Preview the Deployment

```bash
pulumi preview
```

Review for:

1. Namespace creation.
2. Guestbook application resources.
3. Prometheus/Grafana resources.
4. ServiceMonitor or metrics scrape resources.
5. Grafana service exposure.
6. Pulumi outputs for URLs and credentials.

### 9.6 Deploy

```bash
pulumi up
```

Approve only if the pvalidate matches the expected resources.

---

## 10. Expected Pulumi Outputs

The Pulumi program should output the following:

```text
guestbookNamespace: guestbook
monitoringNamespace: monitoring
grafanaServiceType: LoadBalancer
grafanaAdminUser: admin
grafanaAdminPassword: [secret]
grafanaUrl: http://<external-ip-or-dns>:3000
prometheusServiceName: monitoring-kube-prometheus-prometheus
serviceMonitorName: guestbook-servicemonitor
```

If using NodePort, output should include:

```text
grafanaNodePort: 3xxxx
grafanaAccessHint: http://<node-ip>:<node-port>
```

If using port-forward only:

```text
grafanaAccessHint: kubectl -n monitoring port-forward svc/<grafana-service> 3000:80
```

---

## 11. Validation Procedure

### 11.1 Validate Namespaces

```bash
kubectl get ns guestbook monitoring
```

Expected:

```text
NAME         STATUS   AGE
guestbook    Active   ...
monitoring   Active   ...
```

### 11.2 Validate Guestbook Pods

```bash
kubectl -n guestbook get pods -o wide
```

Expected:

```text
frontend-...       Running
redis-leader-...   Running
redis-replica-...  Running
```

### 11.3 Validate Guestbook Services

```bash
kubectl -n guestbook get svc
```

Confirm that the frontend and Redis services exist.

### 11.4 Validate Monitoring Pods

```bash
kubectl -n monitoring get pods
```

Expected components may include:

```text
prometheus-...
grafana-...
alertmanager-...
kube-state-metrics-...
prometheus-operator-...
node-exporter-...
```

Exact names vary by Helm chart and release name.

### 11.5 Validate ServiceMonitor Resources

```bash
kubectl get servicemonitor -A
```

Expected:

```text
NAMESPACE    NAME                    AGE
monitoring   guestbook-servicemonitor ...
```

### 11.6 Validate Prometheus Targets

Option A: Port-forward Prometheus.

```bash
kubectl -n monitoring port-forward svc/<prometheus-service-name> 9090:9090
```

Open:

```text
http://localhost:9090/targets
```

Confirm Guestbook target status is `UP`.

Option B: Query Prometheus API locally after port-forward:

```bash
curl -s 'http://localhost:9090/api/v1/targets' | jq '.data.activeTargets[] | {job: .labels.job, health: .health, scrapeUrl: .scrapeUrl}'
```

### 11.7 Validate Grafana Access

For LoadBalancer:

```bash
kubectl -n monitoring get svc
pulumi stack output grafanaUrl
pulumi stack output grafanaAdminUser
pulumi stack output grafanaAdminPassword --show-secrets
```

For port-forward:

```bash
kubectl -n monitoring port-forward svc/<grafana-service-name> 3000:80
```

Open:

```text
http://localhost:3000
```

### 11.8 Validate Dashboard

In Grafana:

1. Log in using Pulumi outputs.
2. Confirm Prometheus data source exists.
3. Open the Guestbook dashboard.
4. Confirm panels show data for request rate, pod CPU, pod memory, or scrape health.

---

## 12. Metrics Expectations

Minimum expected metrics:

| Metric Type | Example | Source |
|---|---|---|
| Scrape health | `up` | Prometheus target health |
| Pod CPU | `container_cpu_usage_seconds_total` | cAdvisor / kubelet metrics |
| Pod memory | `container_memory_working_set_bytes` | cAdvisor / kubelet metrics |
| Pod status | `kube_pod_status_phase` | kube-state-metrics |
| Request count | `http_requests_total` or equivalent | Guestbook metrics endpoint or proxy/exporter |
| Error count | `http_requests_total{status=~"5.."}` or equivalent | Guestbook metrics endpoint or proxy/exporter |

If the Guestbook application does not natively expose HTTP request metrics, acceptable release candidate patterns include:

1. Add a simple metrics endpoint to the frontend.
2. Add a lightweight sidecar exporter.
3. Use ingress/controller metrics if traffic enters through an instrumented ingress.
4. Use pod and service availability metrics as the minimum baseline, documenting the limitation.

---

## 13. Grafana Dashboard Baseline

A basic dashboard should include:

| Panel | PromQL Example |
|---|---|
| Guestbook target health | `up{namespace="guestbook"}` |
| Frontend pod CPU | `sum(rate(container_cpu_usage_seconds_total{namespace="guestbook", pod=~"frontend.*"}[5m])) by (pod)` |
| Frontend pod memory | `sum(container_memory_working_set_bytes{namespace="guestbook", pod=~"frontend.*"}) by (pod)` |
| Pod restarts | `sum(kube_pod_container_status_restarts_total{namespace="guestbook"}) by (pod)` |
| Request rate | `sum(rate(http_requests_total{namespace="guestbook"}[5m]))` |
| Error rate | `sum(rate(http_requests_total{namespace="guestbook", status=~"5.."}[5m]))` |

If the request-rate metric does not exist, the dashboard should include a note panel explaining that application instrumentation is required.

---

## 14. Routine Operations

### 14.1 Daily Health Checks

```bash
kubectl get nodes
kubectl -n guestbook get pods
kubectl -n monitoring get pods
kubectl get servicemonitor -A
```

Check Grafana dashboard for:

1. Missing data.
2. Prometheus target down alerts.
3. Pod restarts.
4. CPU or memory saturation.
5. Grafana login or dashboard provisioning failures.

### 14.2 Weekly Checks

1. Review Helm chart versions.
2. Review Pulumi stack drift.
3. Confirm Grafana credentials are stored securely.
4. Confirm dashboards still load.
5. Confirm no public endpoints are unintentionally exposed.
6. Review cloud load balancer cost.
7. Review Kubernetes events for noisy failures.

Commands:

```bash
pulumi preview --diff
kubectl -n monitoring get events --sort-by=.lastTimestamp
kubectl -n guestbook get events --sort-by=.lastTimestamp
kubectl -n monitoring get svc
```

### 14.3 Monthly Checks

1. Rotate Grafana admin password in non-lab environments.
2. Upgrade Helm charts in a test stack before production.
3. Review Prometheus retention and storage.
4. Review RBAC permissions.
5. Review cloud security posture for public services.
6. Export or back up important Grafana dashboards.

---

## 15. Change Management

### 15.1 Standard Change Flow

1. Create a Git branch.
2. Update Pulumi code or dashboard JSON.
3. Run local lint and build.
4. Run `pulumi preview`.
5. Attach pvalidate output to change ticket.
6. Obtain approval.
7. Run `pulumi up`.
8. Execute validation checklist.
9. Update runbook notes if behaviour changed.

### 15.2 Emergency Change Flow

Manual `kubectl` changes are allowed only for emergency recovery.

After emergency change:

1. Record command used.
2. Record time and reason.
3. Convert the change into Pulumi code.
4. Run `pulumi preview` to remove drift.
5. Run `pulumi up` to reconcile state.

---

## 16. Troubleshooting Guide

### 16.1 Pulumi Cannot Connect to Cluster

Symptoms:

```text
error: configured Kubernetes cluster is unreachable
```

Checks:

```bash
kubectl cluster-info
kubectl get nodes
kubectl config current-context
```

Fixes:

| Cloud | Fix |
|---|---|
| AWS | Re-run `aws eks update-kubeconfig --region <region> --name <cluster>` |
| Azure | Re-run `az aks get-credentials --resource-group <rg> --name <cluster> --overwrite-existing` |
| Google | Re-run `gcloud container clusters get-credentials <cluster> --region <region> --project <project>` |

---

### 16.2 Prometheus Pods Not Running

Checks:

```bash
kubectl -n monitoring get pods
kubectl -n monitoring describe pod <pod-name>
kubectl -n monitoring get events --sort-by=.lastTimestamp
```

Common causes:

| Cause | Resolution |
|---|---|
| Insufficient CPU/memory | Increase node size or reduce resource requests |
| CRD conflict | Check existing Prometheus Operator CRDs |
| RBAC issue | Confirm chart installed required ClusterRoles |
| Image pull issue | Check registry access and image policy |

---

### 16.3 ServiceMonitor Exists but Target Missing

Checks:

```bash
kubectl get servicemonitor -A
kubectl -n guestbook get svc --show-labels
kubectl -n guestbook get endpoints
kubectl -n monitoring logs deploy/<prometheus-operator-deployment>
```

Likely issue:

The ServiceMonitor selector does not match the Guestbook service labels.

Fix:

1. Confirm the service has the expected labels.
2. Confirm ServiceMonitor `selector.matchLabels` matches exactly.
3. Confirm ServiceMonitor namespace selector includes the `guestbook` namespace.
4. Re-run `pulumi up`.

---

### 16.4 Prometheus Target Is Down

Checks:

```bash
kubectl -n guestbook get pods -o wide
kubectl -n guestbook get svc
kubectl -n guestbook describe svc <service-name>
kubectl -n guestbook port-forward svc/<service-name> 8080:<metrics-port>
curl http://localhost:8080/metrics
```

Common causes:

| Cause | Resolution |
|---|---|
| Metrics port incorrect | Fix ServiceMonitor endpoint port |
| Metrics path incorrect | Use `/metrics` or documented path |
| App not exposing metrics | Add instrumentation or sidecar exporter |
| NetworkPolicy blocking scrape | Allow Prometheus namespace to scrape Guestbook pods |

---

### 16.5 Grafana LoadBalancer Has No External IP

Checks:

```bash
kubectl -n monitoring get svc <grafana-service-name>
kubectl -n monitoring describe svc <grafana-service-name>
```

Cloud-specific causes:

| Cloud | Cause | Resolution |
|---|---|---|
| AWS | Load balancer controller or subnet tagging issue | Check EKS subnet tags and service events |
| Azure | Public IP or quota issue | Check AKS service events and Azure quotas |
| Google | Firewall, quota, or load balancer provisioning delay | Check service events and GCP quotas |

Temporary workaround:

```bash
kubectl -n monitoring port-forward svc/<grafana-service-name> 3000:80
```

---

### 16.6 Grafana Login Fails

Checks:

```bash
pulumi stack output grafanaAdminUser
pulumi stack output grafanaAdminPassword --show-secrets
kubectl -n monitoring get secret
```

Fixes:

1. Confirm the correct secret is used by the Helm chart.
2. Rotate password through Pulumi config.
3. Redeploy with `pulumi up`.
4. Restart Grafana if required.

---

### 16.7 Dashboard Has No Data

Checks:

1. Confirm Prometheus data source works in Grafana.
2. Confirm Prometheus has Guestbook targets.
3. Confirm PromQL labels match actual labels.
4. Confirm dashboard namespace variable is set to `guestbook`.

Useful command:

```bash
kubectl -n guestbook get pods --show-labels
```

---

## 17. Rollback Procedure

### 17.1 Roll Back Last Pulumi Change

If a recent change broke monitoring:

```bash
git log --oneline
# checkout or revert to previous known-good commit
git revert <commit-sha>
npm install
pulumi preview
pulumi up
```

### 17.2 Disable Dashboard Provisioning

```bash
pulumi config set enableGrafanaDashboard false
pulumi up
```

### 17.3 Disable ServiceMonitor

```bash
pulumi config set enableServiceMonitor false
pulumi up
```

### 17.4 Destroy Full Lab Stack

Use only for disposable environments.

```bash
pulumi destroy
pulumi stack rm dev
```

Then verify cloud load balancers and disks have been removed.

---

## 18. Security Controls

### 18.1 Minimum Security Requirements

| Control | Requirement |
|---|---|
| Grafana credentials | Store as Pulumi secret, not plaintext |
| Public exposure | Avoid public Grafana endpoint unless explicitly approved |
| RBAC | Use least privilege where practical |
| Namespaces | Separate app and monitoring namespaces |
| Secrets | Do not commit secrets to Git |
| Network policy | Restrict scrape access where network policies are enforced |
| Audit | Record Pulumi stack, commit SHA, operator, and deployment timestamp |

### 18.2 Recommended Production Hardening

1. Use SSO for Grafana.
2. Use private LoadBalancer or internal ingress.
3. Use TLS for Grafana access.
4. Enable audit logging at cloud and Kubernetes levels.
5. Use cloud-native secret stores or external secrets operator.
6. Configure retention and storage limits for Prometheus.
7. Add alert routing to Slack, Teams, PagerDuty, or Opsgenie.
8. Review all Helm chart values before promotion.

---

## 19. IT Manager Acceptance Criteria

The deployment is considered successful when:

| Requirement | Acceptance Test | Status |
|---|---|---|
| Guestbook deployed | `kubectl -n guestbook get pods` shows Running pods | Pending |
| Prometheus deployed | Prometheus pod is Running | Pending |
| Grafana deployed | Grafana pod is Running | Pending |
| Grafana exposed | LoadBalancer, NodePort, or port-forward access works | Pending |
| Credentials output | Pulumi outputs admin user and password as secret | Pending |
| Metrics scraped | Prometheus target page shows Guestbook target UP | Pending |
| Dashboard available | Grafana dashboard displays Guestbook or pod metrics | Pending |
| Documentation complete | README includes deploy, access, verify, and cleanup instructions | Pending |
| Cloud cleanup documented | Teardown procedure is documented | Pending |

---

## 20. SRE Deployment Checklist

Before deployment:

- [ ] Confirm target cloud and cluster.
- [ ] Confirm kubeconfig context.
- [ ] Confirm Pulumi login and stack.
- [ ] Confirm Grafana exposure type.
- [ ] Confirm secret password is configured.
- [ ] Confirm cost approval for LoadBalancer.
- [ ] Run `pulumi preview`.

During deployment:

- [ ] Run `pulumi up`.
- [ ] Capture Pulumi outputs.
- [ ] Verify namespaces.
- [ ] Verify pods.
- [ ] Verify services.
- [ ] Verify ServiceMonitor.
- [ ] Verify Prometheus targets.
- [ ] Verify Grafana login.
- [ ] Verify dashboard data.

After deployment:

- [ ] Update README with access details.
- [ ] Capture screenshots if required by release candidate.
- [ ] Record cloud, cluster, stack, and commit SHA.
- [ ] Confirm no unintended public endpoints.
- [ ] Confirm cleanup path.

---

## 21. Manager Handoff Summary Template

Use this summary when handing the environment to an IT manager or implementation approver.

```markdown
## Guestbook Monitoring Deployment Handoff

**Date:** YYYY-MM-DD
**Operator:** <name>
**Cloud:** AWS | Azure | Google
**Cluster:** <cluster-name>
**Pulumi stack:** <stack-name>
**Git commit:** <commit-sha>

### Deployed Components

- Guestbook frontend
- Redis leader
- Redis replica
- Prometheus / Prometheus Operator
- Grafana
- ServiceMonitor for Guestbook
- Optional Grafana dashboard

### Access Details

- Grafana URL: `<url>`
- Grafana username: `<username>`
- Grafana password: Stored as Pulumi secret. Retrieve with:

```bash
pulumi stack output grafanaAdminPassword --show-secrets
```

### Validation Results

- Guestbook pods: PASS | FAIL
- Monitoring pods: PASS | FAIL
- Prometheus target scrape: PASS | FAIL
- Grafana dashboard: PASS | FAIL
- Public endpoint validated: PASS | FAIL

### Known Limitations

- <document any missing application-native metrics or dashboard limitations>

### Cleanup Command

```bash
pulumi destroy
```
```

---

## 22. Decommissioning Procedure

For a lab or release candidate environment:

```bash
pulumi stack select dev
pulumi destroy
```

Verify cleanup:

```bash
kubectl get ns guestbook monitoring
```

Cloud checks:

| Cloud | Cleanup Check |
|---|---|
| AWS | Confirm ELB/NLB and EBS volumes are deleted |
| Azure | Confirm public IPs, disks, and load balancers are deleted |
| Google | Confirm forwarding rules, public IPs, and disks are deleted |

For full disposable cluster cleanup:

AWS:

```bash
eksctl delete cluster --name guestbook-monitoring-eks --region us-east-1
```

Azure:

```bash
az group delete --name rg-guestbook-monitoring --yes --no-wait
```

Google:

```bash
gcloud container clusters delete guestbook-monitoring-gke --region us-central1
```

---

## 23. Appendix A: Useful Commands

### Kubernetes Context

```bash
kubectl config current-context
kubectl config get-contexts
```

### Resource Inventory

```bash
kubectl get all -n guestbook
kubectl get all -n monitoring
kubectl get servicemonitor -A
kubectl get crd | grep monitoring.coreos.com
```

### Logs

```bash
kubectl -n guestbook logs deploy/frontend
kubectl -n monitoring logs deploy/<grafana-deployment>
kubectl -n monitoring logs deploy/<prometheus-operator-deployment>
```

### Events

```bash
kubectl -n guestbook get events --sort-by=.lastTimestamp
kubectl -n monitoring get events --sort-by=.lastTimestamp
```

### Port Forwarding

```bash
kubectl -n monitoring port-forward svc/<grafana-service-name> 3000:80
kubectl -n monitoring port-forward svc/<prometheus-service-name> 9090:9090
```

---

## 24. Appendix B: Release Candidate Implementation Checklist

- [ ] GitHub repository or zip file provided.
- [ ] Pulumi code included.
- [ ] README.md included.
- [ ] AWS, Azure, or Google setup path documented.
- [ ] Prometheus and Grafana deployed.
- [ ] Guestbook metrics scrape configured.
- [ ] Grafana URL output by Pulumi.
- [ ] Grafana default credentials output by Pulumi as secret.
- [ ] Instructions to verify Prometheus scrape included.
- [ ] Optional dashboard included or limitation documented.
- [ ] Cleanup instructions included.

---

## 25. Appendix C: References

Use official documentation as the primary source of truth for implementation updates:

1. Pulumi Kubernetes provider and Helm chart resources.
2. Amazon EKS documentation for kubeconfig and cluster access.
3. Azure AKS documentation for `az aks get-credentials` and AKS deployment.
4. Google GKE documentation for `gcloud container clusters get-credentials` and kubectl access.
5. Prometheus Operator documentation for ServiceMonitor and PodMonitor patterns.
6. Grafana Helm chart and dashboard provisioning documentation.
7. Kubernetes documentation for services, namespaces, RBAC, and NetworkPolicy.
