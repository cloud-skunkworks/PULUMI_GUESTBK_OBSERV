# 4IR Solutions — Kubernetes Observability Demo

This standalone RC2 package deploys a small Node.js metrics demo, Redis master and replicas, Prometheus, and Grafana to an **existing Linux Kubernetes cluster**. It is designed for human development, security, and operations engineers.

The frontend demonstrates real HTTP request/error counters and latency using the OpenTelemetry SDK. It does **not** read or write Redis or implement persistent guestbook entries. Redis exists to demonstrate backend topology and pod monitoring.

## Start here

| Task | Guide |
|---|---|
| Build, test, and rebuild both ZIPs | [BUILD-BOOK.md](BUILD-BOOK.md) |
| Deploy, validate, roll back, clean up | [Operations build book](runbook/OPERATIONS.md) |
| Local Kubernetes, AKS, EKS, GKE prerequisites | [Platform build book](runbook/PLATFORMS.md) |
| Configuration and compatibility | [Configuration](docs/configuration.md) |
| Security review and release gates | [SECURITY.md](SECURITY.md) |
| Architecture and requirement coverage | [Architecture](docs/architecture.md) |
| RC1 migration and changes | [CHANGELOG.md](CHANGELOG.md) |

## Build without cloud credentials

Install Node **24.21.0 LTS**, including npm, then open a terminal in the extracted project directory. Use PowerShell on Windows or your native shell on Linux/macOS; the commands are identical.

```text
npm ci --ignore-scripts
npm run check
npm run release
```

The release command creates `release/4iRDemo.zip`, `release/4iRDemo-DevOps-SRE-Runbook.zip`, and `release/SHA256SUMS.txt`. It does not contact Kubernetes or deploy anything. Every implementation ZIP contains source, the lockfile, generated runtime files, tests, scripts, and documentation, so an extracted ZIP can rebuild itself.

Network access to npm is needed for initial installation. Deployment additionally requires the chart repository, container registries, Pulumi backend, and cluster API.

## Deployment overview

Install Pulumi CLI **3.264.0**, Helm 3.22.0 (for the Pulumi Helm Chart renderer), kubectl compatible with the cluster, and the platform's authentication tooling. Select and verify kubeconfig before deployment.

```text
kubectl config current-context
kubectl get nodes
pulumi login
pulumi stack init dev
pulumi config set cloudProvider local
pulumi config set --secret grafanaAdminPassword
npm run preview
npm run up
```

The password command prompts interactively; obtain it from an approved secret manager. Do not place it in a shell argument or release package. Review the preview and follow your environment's change approval process before deploying.

Access stays private by default:

```text
kubectl -n guestbook port-forward svc/guestbook-frontend 8080:80
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
kubectl -n monitoring port-forward svc/prometheus-operated 9090:9090
```

Run each forwarding command in a separate terminal. Open the app on localhost:8080, Grafana on localhost:3000, and Prometheus on localhost:9090. The frontend's metrics are on port **9464**, separately from HTTP; Prometheus scrapes them every 15 seconds.

## What is portable

Cloud choice does not create cloud infrastructure. Standard Kubernetes resources work across local clusters, AKS, EKS, and GKE with supported Linux worker nodes and sufficient capacity. Namespaces, image references, node exporter, and Grafana service annotations are configurable. No workstation paths are embedded.

NetworkPolicy enforcement depends on the cluster CNI. Node exporter uses host-level features and may be rejected on restricted/Autopilot clusters; disable it explicitly and validate the remaining metrics. See the platform guide.

## Delivery status

RC2 includes offline configuration, resource-wiring, application-metrics, and packaging tests. Passing those tests does not prove cloud deployment, policy enforcement, chart admission, image scanning, or dashboard behavior on your cluster. Capture live validation results before promotion.

The package is a demo baseline: Redis and Prometheus storage are ephemeral, there is no application authentication or Redis exporter, and production SSO/TLS, durable storage, alert routing, and complete egress controls remain environment-specific work.


The current version verification and offline chart-render record is in [docs/versions.md](docs/versions.md).
