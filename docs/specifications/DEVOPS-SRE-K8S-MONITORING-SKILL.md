> RC2 implementation and current engineer books are in `project/`. This document preserves the original design requirements; see that project's CHANGELOG and architecture coverage for implemented behavior and gaps. RC2 defaults to private ClusterIP and uses a separate OpenTelemetry metrics port (9464).

# DEVOPS-SRE-K8S-MONITORING-SKILL.md

## Skill Name

**DevOps / SRE Kubernetes Monitoring Extension Skill — Pulumi + Prometheus + Grafana**

## Purpose

Use this skill to generate, validate, or extend a production-quality DevOps/SRE codebase that adds observability to the Pulumi Kubernetes Guestbook example. The output must be suitable for a mid-level SRE or platform engineer to read, deploy, audit, and maintain.

This skill is written for cloud-native delivery on Kubernetes across AWS, GCP, Azure, or local Kubernetes environments, with cloud-specific exposure handled through Kubernetes `Service` types, ingress, or platform load balancers.

## Source Reference

Extend the existing Pulumi Kubernetes Guestbook example:

- Reference application: `https://github.com/pulumi/examples/blob/master/kubernetes-ts-guestbook/README.md`
- Primary stack: Pulumi, Kubernetes, TypeScript, Prometheus, Grafana
- Monitoring implementation: Helm charts or native Kubernetes resources
- Implementation expectation: readable, deployable release-candidate code for engineers familiar with Pulumi, Kubernetes, and Grafana

---

# 1. Executive Requirement

Generate a modular Pulumi TypeScript project that deploys the Kubernetes Guestbook application and adds monitoring with Prometheus and Grafana.

The generated code must:

1. Deploy or extend the Guestbook application.
2. Deploy Prometheus and Grafana using Pulumi.
3. Configure Prometheus to scrape Guestbook metrics.
4. Expose Grafana through `LoadBalancer`, `NodePort`, or configurable ingress.
5. Output Grafana access details from Pulumi.
6. Include clear documentation for a mid-level SRE.
7. Follow CNCF-aligned Kubernetes best practices.
8. Follow observability best practices for metrics, dashboards, and verification.
9. Structure documentation and code along TOGAF-style architecture domains for ease of audit.
10. Remain simple, readable, and robust enough for immediate implementation, while showing production-aware engineering judgement.

---

# 2. Hard Customer Requirements

## 2.1 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Use Pulumi to deploy Prometheus and Grafana to Kubernetes. | Must |
| FR-002 | Prometheus and Grafana may be deployed using Helm charts or direct Kubernetes resources. | Must |
| FR-003 | Configure Prometheus to scrape metrics from Guestbook frontend and backend services. | Must |
| FR-004 | Use `ServiceMonitor`, `PodMonitor`, or Kubernetes scrape annotations where appropriate. | Must |
| FR-005 | Expose simple metrics such as request count, error count, request rate, or resource usage. | Must |
| FR-006 | Expose Grafana using `LoadBalancer`, `NodePort`, or configurable ingress. | Must |
| FR-007 | Output Grafana URL and default admin credentials from Pulumi. | Must |
| FR-008 | Provide deployment instructions in `README.md`. | Must |
| FR-009 | Provide verification steps proving that metrics are being scraped. | Must |
| FR-010 | Provide a basic Grafana dashboard for Guestbook request rate, error rate, and pod resource usage. | Should / Stretch |
| FR-011 | Provide code as a GitHub repository or zip file. | Must |

## 2.2 Non-Functional Requirements

| ID | Requirement | Acceptance Standard |
|---|---|---|
| NFR-001 | Human-readable documentation | A mid-level SRE can deploy, verify, troubleshoot, and explain the solution. |
| NFR-002 | Modular code | Application, monitoring, dashboards, and outputs are separated into clear modules. |
| NFR-003 | CNCF best practice alignment | Uses namespaces, labels, selectors, health probes, resource requests/limits, and declarative resources. |
| NFR-004 | Observability best practice alignment | Metrics are named, discoverable, dashboarded, and verifiable. |
| NFR-005 | TOGAF-style audit structure | Documentation separates business, application, data, technology, security, and operations architecture. |
| NFR-006 | Cloud portability | Solution works on Kubernetes across AWS EKS, GCP GKE, Azure AKS, or local clusters with configuration changes only. |
| NFR-007 | Reproducibility | `pulumi up` deploys the stack; `pulumi destroy` cleans it up. |
| NFR-008 | Least privilege | Avoid cluster-admin assumptions unless clearly documented for the monitoring stack. |
| NFR-009 | Secure defaults | Avoid committing real secrets; use Pulumi config/secrets for credentials. |
| NFR-010 | Maintainability | Pin chart versions where practical and document upgrade paths. |
| NFR-011 | Day-one stability | Prefer fewer moving parts, pinned versions, explicit dependencies, health probes, resource requests/limits, and validation steps. |

---

# 3. Target User

The generated repository must be understandable by:

- A mid-level DevOps/SRE engineer
- A platform engineer validating the release candidate before implementation
- A cloud architect auditing Kubernetes observability design
- An implementation approver validating Pulumi, Kubernetes, Grafana, and Prometheus behavior

Use direct technical language. Avoid excessive abstractions. Every generated file should include comments explaining why it exists and what a maintainer should change.

---

# 4. Architecture Principles

## 4.1 Cloud-Native Principles

The generated solution must follow these principles:

1. **Declarative infrastructure**
   - All Kubernetes resources must be described through Pulumi.
   - Avoid manual `kubectl apply` steps except for diagnostics.

2. **Separation of concerns**
   - Guestbook application resources must be separate from monitoring resources.
   - Dashboards must be separate from core Prometheus/Grafana deployment code.

3. **Observable by design**
   - Services must expose metrics endpoints or be annotated for scraping.
   - Dashboards must map directly to the metrics being scraped.

4. **Least privilege**
   - Use dedicated namespaces and service accounts.
   - Avoid unnecessary cluster-wide permissions unless required by the selected Helm chart.

5. **Portable Kubernetes**
   - Do not hardcode AWS/GCP/Azure-specific behaviour unless isolated behind configuration.
   - Allow `LoadBalancer`, `NodePort`, or ingress exposure to be selected through Pulumi config.

6. **Auditability**
   - Use consistent labels and annotations.
   - Keep resource naming predictable.
   - Document the deployment flow and verification commands.

---

# 5. Recommended Repository Structure

Generate the repository using the following structure:

```text
pulumi-k8s-guestbook-monitoring/
├── README.md
├── Pulumi.yaml
├── Pulumi.dev.yaml.example
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── namespaces.ts
│   ├── guestbook/
│   │   ├── index.ts
│   │   ├── frontend.ts
│   │   ├── redis-master.ts
│   │   ├── redis-replica.ts
│   │   └── metrics.ts
│   ├── monitoring/
│   │   ├── index.ts
│   │   ├── prometheus.ts
│   │   ├── grafana.ts
│   │   ├── service-monitors.ts
│   │   └── dashboards.ts
│   ├── security/
│   │   ├── rbac.ts
│   │   └── network-policies.ts
│   └── outputs.ts
├── dashboards/
│   └── guestbook-dashboard.json
├── docs/
│   ├── architecture.md
│   ├── operations-runbook.md
│   ├── verification.md
│   └── troubleshooting.md
└── tests/
    └── README.md
```

## File Responsibilities

| File | Responsibility |
|---|---|
| `src/index.ts` | Main Pulumi entry point. Wires application, monitoring, dashboard, and outputs. |
| `src/config.ts` | Reads Pulumi config for namespace, exposure type, chart versions, and credentials. |
| `src/namespaces.ts` | Creates application and monitoring namespaces. |
| `src/guestbook/*` | Guestbook deployments, services, labels, and metrics exposure. |
| `src/monitoring/prometheus.ts` | Deploys Prometheus or kube-prometheus-stack through Helm. |
| `src/monitoring/grafana.ts` | Deploys Grafana and configures service exposure. |
| `src/monitoring/service-monitors.ts` | Creates `ServiceMonitor` or scrape annotations for Guestbook services. |
| `src/monitoring/dashboards.ts` | Loads dashboard JSON into Grafana using ConfigMaps or Helm values. |
| `src/security/*` | Optional RBAC and NetworkPolicy resources. |
| `src/outputs.ts` | Exports Grafana URL, username, password, Prometheus service details, and namespaces. |
| `docs/architecture.md` | TOGAF-style architecture view. |
| `docs/operations-runbook.md` | Operational commands, rollout checks, and remediation steps. |
| `docs/verification.md` | Prometheus target checks and Grafana dashboard checks. |
| `docs/troubleshooting.md` | Common failure modes and fixes. |

---

# 6. Pulumi Implementation Requirements

## 6.1 Language and Runtime

Use:

- TypeScript
- Pulumi
- `@pulumi/pulumi`
- `@pulumi/kubernetes`
- Kubernetes provider configured from the active kubeconfig context

The generated code must avoid mixing shell-driven Helm commands with Pulumi-managed resources. If Helm charts are used, deploy them through Pulumi Kubernetes Helm resources.

## 6.2 Helm Guidance

Preferred option:

- Use `kube-prometheus-stack` when the release candidate permits a complete Prometheus Operator stack.
- Use Grafana Helm chart directly only when a simpler stack is desired.
- Use Pulumi Kubernetes Helm Chart resources to install charts.

Acceptable options:

1. `kube-prometheus-stack`
   - Pros: includes Prometheus Operator, Prometheus, Grafana, ServiceMonitor CRDs.
   - Cons: heavier deployment.

2. Separate Prometheus and Grafana charts
   - Pros: smaller conceptual footprint.
   - Cons: requires more explicit scrape configuration.

The generated README must state which option was chosen and why.

## 6.3 Pulumi Config Requirements

Support at minimum:

```bash
pulumi config set appNamespace guestbook
pulumi config set monitoringNamespace monitoring
pulumi config set grafanaServiceType LoadBalancer
pulumi config set grafanaAdminUser admin
pulumi config set --secret grafanaAdminPassword '<password>'
```

Optional config:

```bash
pulumi config set prometheusChartVersion '<version>'
pulumi config set grafanaChartVersion '<version>'
pulumi config set enableNetworkPolicies true
pulumi config set enableDashboard true
pulumi config set cloudProvider aws|gcp|azure|local
```

Generated code must provide safe defaults, but credentials must be configurable as Pulumi secrets.

---

# 7. Guestbook Monitoring Requirements

## 7.1 Metrics Exposure

The Guestbook frontend must expose at least one metrics endpoint.

Preferred endpoint:

```text
/metrics
```

Minimum acceptable metrics:

| Metric | Type | Description |
|---|---|---|
| `guestbook_http_requests_total` | Counter | Total HTTP requests served by the frontend. |
| `guestbook_http_request_errors_total` | Counter | Total failed HTTP requests. |
| `guestbook_http_request_duration_seconds` | Histogram | Request latency distribution. |
| `container_cpu_usage_seconds_total` | Counter | CPU usage from cAdvisor/kubelet metrics, if available. |
| `container_memory_working_set_bytes` | Gauge | Pod memory usage from Kubernetes metrics, if available. |

If the base Guestbook container does not expose application metrics, the generated solution may choose one of these approaches:

1. Add a lightweight metrics sidecar.
2. Wrap or replace the frontend with a minimal instrumented TypeScript/Node.js frontend.
3. Use only Kubernetes pod/container resource metrics for the base application and clearly document the limitation.
4. Use annotations and service discovery to scrape available endpoints where supported.

The generated code must not pretend that application request metrics exist unless the code exposes them.

## 7.2 ServiceMonitor Pattern

When using Prometheus Operator, generate a `ServiceMonitor` similar to this conceptual pattern:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: guestbook-frontend
  namespace: monitoring
  labels:
    app.kubernetes.io/name: guestbook
    app.kubernetes.io/component: frontend
spec:
  namespaceSelector:
    matchNames:
      - guestbook
  selector:
    matchLabels:
      app.kubernetes.io/name: guestbook
      app.kubernetes.io/component: frontend
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

Generated Pulumi code must define this as a Pulumi Kubernetes `CustomResource` unless using typed CRDs from an imported package.

## 7.3 Annotation Pattern

If not using Prometheus Operator, annotations may be used:

```yaml
prometheus.io/scrape: "true"
prometheus.io/path: "/metrics"
prometheus.io/port: "8080"
```

The generated README must explain that annotations require Prometheus scrape configuration compatible with Kubernetes service discovery.

---

# 8. Grafana Requirements

## 8.1 Exposure

Grafana must be exposed with one of the following:

1. `LoadBalancer`
2. `NodePort`
3. Ingress, if explicitly configured

Default for cloud clusters:

```text
LoadBalancer
```

Default for local clusters:

```text
NodePort
```

The chosen service type must be configurable through Pulumi config.

## 8.2 Pulumi Outputs

The generated Pulumi program must output:

| Output | Description |
|---|---|
| `grafanaUrl` | URL or service details for Grafana access. |
| `grafanaAdminUser` | Admin username. |
| `grafanaAdminPassword` | Admin password, marked as secret. |
| `prometheusServiceName` | Prometheus service name. |
| `appNamespace` | Guestbook namespace. |
| `monitoringNamespace` | Monitoring namespace. |
| `guestbookFrontendUrl` | Guestbook frontend URL or service details. |

For `LoadBalancer`, the URL may need to be an asynchronous Pulumi output based on service ingress hostname/IP.

For `NodePort`, output the service name, node port, and a local port-forward fallback command.

## 8.3 Dashboard Stretch Goal

If the dashboard is implemented, include panels for:

| Panel | Query Example |
|---|---|
| Request rate | `rate(guestbook_http_requests_total[5m])` |
| Error rate | `rate(guestbook_http_request_errors_total[5m])` |
| Pod CPU | `sum(rate(container_cpu_usage_seconds_total{namespace="guestbook"}[5m])) by (pod)` |
| Pod memory | `container_memory_working_set_bytes{namespace="guestbook"}` |
| Pod restarts | `kube_pod_container_status_restarts_total{namespace="guestbook"}` |

The dashboard must be provisioned automatically through Grafana provisioning, Helm values, or ConfigMaps.

---

# 9. TOGAF-Style Architecture Documentation Requirement

Generate `docs/architecture.md` with the following structure.

## 9.1 Business Architecture

Describe:

- Purpose of the release candidate.
- Stakeholder expectations.
- Release success criteria.
- Operational value of monitoring the Guestbook app.

## 9.2 Application Architecture

Describe:

- Guestbook frontend.
- Redis master.
- Redis replica.
- Metrics endpoint.
- ServiceMonitor/scrape flow.
- Grafana dashboard.

## 9.3 Data Architecture

Describe:

- Metrics emitted by Guestbook.
- Metrics scraped by Prometheus.
- Time-series retention assumption.
- Grafana query path.
- No persistent business data beyond Guestbook sample state.

## 9.4 Technology Architecture

Describe:

- Kubernetes namespace model.
- Pulumi deployment model.
- Helm chart deployment model.
- Prometheus/Grafana service exposure.
- Cloud portability across EKS, GKE, AKS, and local clusters.

## 9.5 Security Architecture

Describe:

- Pulumi secrets for Grafana admin password.
- Namespace separation.
- RBAC assumptions.
- NetworkPolicy optional configuration.
- Do not commit credentials.
- Avoid exposing Grafana publicly without authentication.

## 9.6 Operations Architecture

Describe:

- Deployment commands.
- Verification commands.
- Rollback/destroy commands.
- Troubleshooting steps.
- Expected SRE handoff notes.

---

# 10. README.md Requirements

The generated repository must include a `README.md` with these sections:

```markdown
# Pulumi Kubernetes Guestbook Monitoring

## Overview
## Architecture Summary
## Prerequisites
## Repository Structure
## Configuration
## Deployment Steps
## Accessing Grafana
## Accessing Guestbook
## Verifying Prometheus Scraping
## Grafana Dashboard
## Troubleshooting
## Cleanup
## Design Decisions
## Security Notes
## Known Limitations
```

## 10.1 Prerequisites

Include:

- Node.js LTS
- Pulumi CLI
- Kubernetes cluster
- Valid kubeconfig context
- Helm capability through Pulumi provider
- kubectl
- Optional: cloud CLI for AWS, GCP, or Azure

## 10.2 Deployment Commands

Include commands similar to:

```bash
npm install
pulumi stack init dev
pulumi config set appNamespace guestbook
pulumi config set monitoringNamespace monitoring
pulumi config set grafanaServiceType LoadBalancer
pulumi config set grafanaAdminUser admin
pulumi config set --secret grafanaAdminPassword 'ChangeMe-Use-A-Secret'
pulumi up
```

## 10.3 Verification Commands

Include commands similar to:

```bash
kubectl get pods -n guestbook
kubectl get pods -n monitoring
kubectl get svc -n monitoring
kubectl get servicemonitor -A
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
```

Prometheus UI verification:

1. Open Prometheus.
2. Go to **Status → Targets**.
3. Confirm Guestbook scrape targets are `UP`.
4. Query:
   - `up{namespace="guestbook"}`
   - `guestbook_http_requests_total`
   - `rate(guestbook_http_requests_total[5m])`

Grafana verification:

1. Open Grafana.
2. Login with Pulumi-output credentials.
3. Confirm Prometheus datasource exists.
4. Open Guestbook dashboard.
5. Generate Guestbook traffic.
6. Confirm panels update.

## 10.4 Cleanup Commands

```bash
pulumi destroy
pulumi stack rm dev
```

---

# 11. Code Quality Requirements

Generated code must satisfy these standards:

1. Use descriptive names.
2. Keep modules small.
3. Avoid hardcoded secrets.
4. Use Pulumi config for environment-specific settings.
5. Add comments for SRE-relevant decisions.
6. Use consistent Kubernetes labels:
   - `app.kubernetes.io/name`
   - `app.kubernetes.io/component`
   - `app.kubernetes.io/part-of`
   - `app.kubernetes.io/managed-by`
7. Apply resource requests and limits.
8. Use readiness and liveness probes where possible.
9. Avoid excessive abstractions that obscure the release candidate.
10. Keep a clear path from README instructions to deployed resources.

---

# 12. Kubernetes Best Practice Requirements

The generated Kubernetes resources must include:

| Practice | Requirement |
|---|---|
| Namespaces | Separate `guestbook` and `monitoring` namespaces. |
| Labels | Use Kubernetes recommended application labels. |
| Probes | Add readiness and liveness probes for app containers where possible. |
| Resources | Add CPU/memory requests and limits. |
| Services | Use named ports, especially `http` and `metrics`. |
| Config | Use ConfigMaps for non-secret config. |
| Secrets | Use Kubernetes Secrets or Pulumi secrets for credentials. |
| RBAC | Use least-privilege service accounts where custom RBAC is needed. |
| NetworkPolicy | Provide optional policies if the cluster CNI supports them. |
| Portability | Avoid cloud-provider-specific resources unless isolated behind config. |

---

# 13. Observability Best Practice Requirements

The generated solution must follow these observability requirements:

1. Define what is being measured.
2. Separate infrastructure metrics from application metrics.
3. Use Prometheus-compatible metrics.
4. Use stable metric names.
5. Include labels for service, namespace, component, and pod where practical.
6. Avoid high-cardinality labels such as request IDs or user IDs.
7. Include dashboard panels that map to release candidate objectives.
8. Provide commands to verify scrape status.
9. Provide basic troubleshooting for missing metrics.
10. Explain the difference between:
    - Metrics
    - Logs
    - Traces
    - Dashboards
    - Alerts

Alerts are optional for this release candidate, but generated documentation should mention likely next-step alerts:

| Alert | Example Condition |
|---|---|
| GuestbookDown | `up{namespace="guestbook"} == 0` |
| HighErrorRate | Error rate over threshold for 5 minutes. |
| HighLatency | P95 latency above threshold. |
| PodCrashLooping | Restart count increasing. |

---

# 14. Security Requirements

The generated code and documentation must include these security controls:

1. Do not commit real Grafana passwords.
2. Use `pulumi config set --secret` for Grafana admin password.
3. Mark sensitive Pulumi outputs as secrets.
4. Document that `LoadBalancer` can expose Grafana publicly in cloud environments.
5. Recommend ingress with TLS and SSO/OIDC for production.
6. Use namespace boundaries.
7. Avoid granting unnecessary cluster-admin privileges.
8. Document any chart permissions that are cluster-scoped.
9. Do not expose Prometheus publicly by default.
10. Provide port-forward as a safer local diagnostic path.

---

# 15. Multi-Cloud Requirements

The generated solution must be deployable to:

- AWS EKS
- Google Kubernetes Engine
- Azure Kubernetes Service
- Local Kubernetes clusters such as kind, minikube, or Docker Desktop

Cloud-specific notes:

| Cloud | Note |
|---|---|
| AWS EKS | `LoadBalancer` may provision an ELB/NLB depending on annotations and controller configuration. |
| GCP GKE | `LoadBalancer` typically provisions a Google Cloud external load balancer. |
| Azure AKS | `LoadBalancer` typically provisions an Azure Load Balancer public IP. |
| Local | `LoadBalancer` may stay pending; use `NodePort` or `kubectl port-forward`. |

Generated README must include this practical note:

```text
If EXTERNAL-IP is pending, use NodePort or kubectl port-forward. This is common on local clusters without a cloud load balancer implementation.
```

---

# 16. Acceptance Criteria

An implementation approver must be able to validate the submission with the following checklist.

## 16.1 Deployment

- [ ] `npm install` succeeds.
- [ ] `pulumi up` succeeds.
- [ ] Guestbook pods are running.
- [ ] Prometheus pods are running.
- [ ] Grafana pods are running.
- [ ] Grafana service is exposed.
- [ ] Pulumi outputs include Grafana access details.

## 16.2 Monitoring

- [ ] Prometheus has Guestbook targets.
- [ ] Guestbook targets show as `UP`.
- [ ] At least one Guestbook-related metric can be queried.
- [ ] Pod CPU or memory metrics are visible.
- [ ] Grafana can query Prometheus.
- [ ] Dashboard panels display data.

## 16.3 Code Quality

- [ ] Code is modular.
- [ ] README is clear.
- [ ] TOGAF-style architecture documentation exists.
- [ ] Secrets are not hardcoded.
- [ ] Resource labels are consistent.
- [ ] Kubernetes resources are namespaced appropriately.
- [ ] Cleanup instructions work.

---

# 17. Required Generated Deliverables

When this skill is used to generate the release candidate code, the result must include:

1. `README.md`
2. `Pulumi.yaml`
3. `package.json`
4. `tsconfig.json`
5. Pulumi TypeScript source files under `src/`
6. Guestbook Kubernetes resources
7. Prometheus and Grafana deployment code
8. ServiceMonitor or scrape annotation code
9. Grafana dashboard JSON or provisioning code
10. TOGAF-style architecture document
11. Operations runbook
12. Verification guide
13. Troubleshooting guide
14. Optional tests or validation notes
15. Zip-ready repository layout

---

# 18. Prompt to Generate the Codebase

Use the following prompt when asking an AI coding agent to generate the implementation.

```text
You are a senior DevOps/SRE platform engineer.

Generate a complete Pulumi TypeScript repository that extends the Pulumi Kubernetes Guestbook example with Prometheus and Grafana monitoring.

Hard requirements:
1. Use Pulumi TypeScript.
2. Deploy the Guestbook app to Kubernetes.
3. Deploy Prometheus and Grafana using Pulumi-managed Helm charts or Pulumi Kubernetes resources.
4. Configure Prometheus to scrape Guestbook frontend and backend metrics using ServiceMonitor, PodMonitor, or scrape annotations.
5. Expose simple metrics such as request count, error count, request rate, and Kubernetes pod resource usage.
6. Expose Grafana through a configurable service type: LoadBalancer, NodePort, or ingress.
7. Output Grafana URL, admin username, and admin password from Pulumi.
8. Use Pulumi secrets for sensitive credentials.
9. Include a basic Grafana dashboard for Guestbook request rate, error rate, CPU, memory, and pod restart metrics.
10. Include a README with deployment, verification, Grafana access, Prometheus target checks, troubleshooting, and cleanup.
11. Structure code into clear modules for config, namespaces, guestbook, monitoring, dashboards, security, and outputs.
12. Add comments suitable for a mid-level SRE.
13. Follow Kubernetes and CNCF best practices: namespaces, labels, probes, requests/limits, secrets, RBAC, named ports, and optional NetworkPolicy.
14. Include TOGAF-style architecture documentation covering business, application, data, technology, security, and operations architecture.
15. Keep the solution deployable to AWS EKS, GCP GKE, Azure AKS, and local Kubernetes with config-only changes.

Repository structure:
- README.md
- Pulumi.yaml
- Pulumi.dev.yaml.example
- package.json
- tsconfig.json
- src/index.ts
- src/config.ts
- src/namespaces.ts
- src/guestbook/
- src/monitoring/
- src/security/
- src/outputs.ts
- dashboards/guestbook-dashboard.json
- docs/architecture.md
- docs/operations-runbook.md
- docs/verification.md
- docs/troubleshooting.md

Implementation guidance:
- Prefer kube-prometheus-stack if using Prometheus Operator and ServiceMonitor.
- Use Pulumi Kubernetes Helm Chart resources for Helm charts.
- Create ServiceMonitor resources as Pulumi CustomResource objects if using Prometheus Operator.
- If the Guestbook app does not expose application metrics, add a lightweight instrumented frontend or metrics sidecar and document the decision.
- Do not claim request metrics exist unless the implementation actually emits them.
- Use Pulumi config for chart versions, namespaces, service type, and credentials.
- Mark secret outputs as Pulumi secrets.
- Include verification commands for kubectl, Prometheus targets, PromQL queries, and Grafana dashboards.

Generate all files with production-aware comments and clear SRE documentation.
```

---

# 19. Evaluation Rubric

| Area | Excellent | Acceptable | Weak |
|---|---|---|---|
| Pulumi | Modular TypeScript, config-driven, secret-aware | Deploys resources but limited structure | Manual Helm/kubectl steps dominate |
| Kubernetes | Namespaces, labels, probes, resources, services | Basic deployments and services | Poor labels, no resources, unclear service model |
| Prometheus | ServiceMonitor/PodMonitor cleanly implemented | Scrape annotations only | No clear scrape path |
| Grafana | Exposed, credentialed, dashboarded | Exposed without dashboard | Not reachable or undocumented |
| Documentation | README + architecture + runbook + verification | README only | Minimal or unclear |
| Security | Secrets, RBAC notes, exposure risks documented | Some secret handling | Hardcoded passwords |
| Observability | Metrics mapped to dashboards and verification | Basic targets visible | No meaningful metrics |
| TOGAF auditability | Clear domain sections | Partial architecture notes | No audit structure |

---

# 20. Common Failure Modes to Avoid

1. Deploying Grafana but not exposing it.
2. Outputting a static Grafana URL that does not work on all clusters.
3. Creating a ServiceMonitor without matching service labels.
4. Creating a ServiceMonitor in the wrong namespace without a namespace selector.
5. Forgetting that CRDs must exist before creating ServiceMonitor resources.
6. Hardcoding the Grafana admin password in source control.
7. Claiming request metrics exist when only pod metrics exist.
8. Using unnamed Kubernetes service ports.
9. Omitting verification steps.
10. Building an over-engineered solution that cannot be validated in a 1–2 hour release candidate.

---

# 21. Final Implementation engineer Submission Checklist

Before submitting the repository or zip file, verify:

- [ ] `pulumi up` completes.
- [ ] `kubectl get pods -n guestbook` shows running pods.
- [ ] `kubectl get pods -n monitoring` shows running monitoring pods.
- [ ] `pulumi stack output grafanaUrl` returns useful access information.
- [ ] Grafana login works.
- [ ] Prometheus datasource works in Grafana.
- [ ] Guestbook service is reachable.
- [ ] Guestbook traffic causes dashboard changes.
- [ ] Prometheus targets show Guestbook targets as `UP`.
- [ ] README includes deployment and verification steps.
- [ ] No real secrets are committed.
- [ ] `pulumi destroy` works.

---

# 22. Reference Notes for Maintainers

- Pulumi Kubernetes provider can manage native Kubernetes resources and Helm charts.
- Prometheus Operator uses `ServiceMonitor` and `PodMonitor` custom resources to define scrape targets.
- Grafana Helm charts can provision Grafana on Kubernetes.
- Kubernetes observability should distinguish metrics, logs, traces, events, dashboards, and alerts.
- For production, add TLS, SSO/OIDC, alert routing, retention configuration, persistent storage, and network policies.
