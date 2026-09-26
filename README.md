# Kubernetes Guestbook Observability — RC2

A rebuildable **Pulumi TypeScript monitoring demo** for an existing Kubernetes cluster, with OpenTelemetry metrics, Prometheus, Grafana, and standalone DevSecOps engineer books.

**Status:** RC2 · local build and six automated tests verified · live cloud deployment still unverified.

The frontend serves a demo page and emits real request, error, and latency metrics. Redis master/replicas demonstrate backend topology; the frontend does **not** yet store guestbook entries in Redis. See the [gap review](docs/reviews/RC2-GAP-REVIEW.md) before planning production use.

## Start here

| You want to… | Go to |
|---|---|
| Download RC2 | [Implementation ZIP](releases/RC2/4iRDemo.zip) · [Standalone runbooks ZIP](releases/RC2/4iRDemo-DevOps-SRE-Runbook.zip) |
| Verify your download | [SHA-256 checksums](releases/RC2/SHA256SUMS.txt) · [Validation record](releases/RC2/VALIDATION.md) |
| Understand the application | [Project README](project/README.md) · [Architecture](project/docs/architecture.md) |
| Build, test, or rebuild the ZIPs | [Engineer build book](project/BUILD-BOOK.md) |
| Deploy or operate the demo | [Operations playbook](project/runbook/OPERATIONS.md) · [Platform guide](project/runbook/PLATFORMS.md) |
| Run verifiable smoke tests | [Functional smoke tests and expected results](project/runbook/VALIDATION.md#functional-smoke-tests-available-now) |
| Review security | [Security controls and production gaps](project/SECURITY.md) |
| Configure namespaces, images, or access | [Configuration reference](project/docs/configuration.md) |
| Review versions and migration | [Version record](project/docs/versions.md) · [RC2 changes](project/CHANGELOG.md) |
| Plan remaining work | [Recommended sequence](project/runbook/OPERATIONS.md#8-recommended-sequence) · [Prioritized gap review](docs/reviews/RC2-GAP-REVIEW.md) |
| Trace original requirements | [Specification index](docs/specifications/README.md) |

## Repository map

```text
.
├── README.md                   Start here: navigation and quick commands
├── CONTRIBUTING.md             How engineers change, validate, and publish
├── project/                    Self-contained runnable Pulumi project
│   ├── app/                    Readable Node.js application and OTel metrics
│   ├── src/                    TypeScript infrastructure modules
│   │   ├── guestbook/          Frontend and Redis resources
│   │   ├── monitoring/         Chart, ServiceMonitor, dashboard, access
│   │   └── security/           Service account and network policies
│   ├── dashboards/             Grafana dashboard as JSON
│   ├── scripts/                Build, package, and live validation
│   ├── tests/                  Offline application, infrastructure, ZIP checks
│   ├── docs/                   Architecture, configuration, version references
│   ├── runbook/                Standalone human operator books
│   ├── BUILD-BOOK.md            Rebuild and release instructions
│   └── SECURITY.md             Controls, boundaries, promotion requirements
├── docs/
│   ├── specifications/        Original design and operator requirements
│   └── reviews/               RC2 findings and remaining work
└── releases/
    └── RC2/                    Published ZIPs, checksums, validation record
```

Generated `project/lib/`, `project/generated/`, dependencies, and local stack configuration are not committed. The implementation ZIP includes generated runtime files as well as the source required to rebuild them. Earlier RC1 artifacts remain in Git history; RC2 is the current checked-in release.

## Build locally

Install **Node 24.21.0 LTS with npm**. These commands work from a native Windows PowerShell, Linux, or macOS terminal; execution has been verified on Windows.

```text
git clone https://github.com/cloud-skunkworks/PULUMI_GUESTBK_OBSERV.git
cd PULUMI_GUESTBK_OBSERV/project
npm ci --ignore-scripts
npm run check
npm run release
```

The release command writes both ZIPs and their checksums to `project/release/`. It does not deploy anything. The reviewed publication copies are in `releases/RC2/`.

## Functional smoke tests

**Local, no cluster:** after building, run:

```text
node --test tests/app.test.cjs
```

It verifies HTTP 200/500/404, request and error counts, latency observations, and exclusion of probes/scrapes from the request count.

**Live cluster:** after deployment and the localhost port-forwards documented in the playbook, run:

```text
node scripts/validate.mjs --app-namespace guestbook --monitoring-namespace monitoring
```

This checks application rollout readiness, monitor/service selectors, matched Prometheus targets, and request-counter growth. It has not yet been executed against a live cluster for RC2; Grafana, Redis behavior, and policy enforcement need additional checks.

## Deployment boundaries

- Uses an existing Linux Kubernetes cluster: local, AKS, EKS, or GKE.
- Grafana and application services default to private ClusterIP.
- Pulumi secrets protect the Grafana admin password; never commit credentials, state, kubeconfig, or .env files.
- Helm-managed resources are created through Pulumi.
- Production needs further identity, storage/recovery, network, alerting, and delivery controls.
- The five-step remaining-work sequence is tracked in the [operations playbook](project/runbook/OPERATIONS.md#8-recommended-sequence).

## Upstream resources

- [Pulumi Kubernetes provider](https://www.pulumi.com/registry/packages/kubernetes/)
- [Original Pulumi Guestbook example](https://github.com/pulumi/examples/tree/master/kubernetes-ts-guestbook)
- [Prometheus community monitoring chart](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [Grafana documentation](https://grafana.com/docs/grafana/latest/)
- [Kubernetes documentation](https://kubernetes.io/docs/home/)

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing source or publishing a new artifact.
