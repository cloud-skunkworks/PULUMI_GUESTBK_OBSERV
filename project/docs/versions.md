# Version and Validation Record

Verified 2026-09-25 from official registries/releases. Pins describe the release, not an automatic update policy.

| Component | Pin | Reason / source |
|---|---|---|
| Node | 24.21.0 | Current LTS line; https://nodejs.org/dist/index.json |
| Pulumi CLI / SDK | 3.264.0 | Official GitHub release / npm registry |
| Kubernetes SDK | 4.34.2 | Official npm registry |
| TypeScript | 6.0.3 | Latest stable <7; Pulumi peer compatibility excludes 7.0.2 |
| Node type definitions | 24.13.6 | Latest stable types matching Node 24 |
| OpenTelemetry metrics | 2.11.0 | Official npm registry |
| Prometheus exporter | 0.222.0 | Official npm registry |
| esbuild | 0.28.2 | Official npm registry |
| fflate | 0.8.3 | Official npm registry |
| kube-prometheus-stack | 91.5.2 | Published Prometheus community chart index |
| Helm renderer | 3.22.0 | Latest stable Helm 3 release; binary checksum verified |
| Redis image | 8.10.2-alpine3.23 | Docker official-images redis manifest |
| Node image | 24.21.0-alpine3.23 | Docker official-images node manifest |

The chart pins its own Grafana, exporter, and operator dependencies. We do not independently override those versions because the chart is the compatibility unit.

References:
- https://registry.npmjs.org/
- https://github.com/pulumi/pulumi/releases
- https://prometheus-community.github.io/helm-charts/index.yaml
- https://github.com/helm/helm/releases
- https://github.com/docker-library/official-images/blob/master/library/node
- https://github.com/docker-library/official-images/blob/master/library/redis

Offline chart rendering succeeded using the actual code-generated values, a dummy admin password, Helm 3.22.0, chart 91.5.2, and Kubernetes API version 1.34.0. This validates templating, not cluster admission or live behavior. No chart resources were installed.

The npm audit performed on this date reported zero known vulnerabilities across the installed dependency graph. This is not a container scan or a guarantee against undisclosed issues.
