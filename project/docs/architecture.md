# Architecture — TOGAF Domains

## Business

Demonstrate observable Kubernetes workloads and a reviewable DevSecOps release. This is an engineering demo, not a payment-processing service or a full guestbook product.

## Application

Pulumi src/index.ts wires namespaces, service account, application resources, policies, monitoring, dashboard, and outputs. app/server.cjs serves a static page, health endpoint, and simulated error. Redis master and two replicas illustrate backend topology; the frontend does not consume them.

## Data

OpenTelemetry records actual request counts, errors, and response-finish latency. The Prometheus exporter listens on port 9464; no identifiers or request payloads are recorded. Prometheus also collects kubelet/cAdvisor and kube-state-metrics data. Redis-specific metrics are not implemented. Storage is ephemeral; Prometheus retention is six hours.

## Technology

Pulumi uses compiled TypeScript and a Pulumi-managed kube-prometheus-stack Helm Chart. No shell helm install or kubectl apply manages resources. A ServiceMonitor selects shared frontend service labels and the configured app namespace. Grafana discovers a dashboard ConfigMap in the monitoring namespace. Linux containers support the architectures provided by the selected images; validate chart image architecture on each target.

The local build bundles OpenTelemetry into a ConfigMap payload to avoid a runtime npm install or custom application image registry. A checksum on the pod template rolls out source changes.

## Security

See SECURITY.md for private defaults, credentials, identity, network boundaries, and remaining production controls. Prometheus Operator needs cluster-scoped permissions; namespace separation does not remove those permissions.

## Operations

Read the standalone runbook. Build and archive creation are independent of cloud credentials. Deployment requires an existing cluster, Pulumi backend, Helm renderer, and approved permissions. Resource names remain stable across RC1/RC2 where possible.

## Requirement coverage and limits

FR-001/002: Pulumi-managed monitoring chart. FR-004: frontend ServiceMonitor.
FR-005/010: real HTTP metrics and resource dashboard. FR-006/007: configurable service exposure and secret access output. FR-008/009/011: books, validation procedure, rebuildable ZIPs.
FR-003 is only partially fulfilled: frontend metrics are scraped; backend coverage is pod-level, not a Redis exporter.
NFR-005: these TOGAF domains remain explicit. Portability is configurable design, not a claim that every target has been deployment-tested.
