# RC2 — portability, maintainability, and repeatable delivery

- Pinned direct packages and added package-lock.json.
- Updated Pulumi SDK 3.264.0, Kubernetes provider 4.34.2, chart 91.5.2, Node LTS 24.21.0, Redis 8.10.2.
- Selected TypeScript 6.0.3 because Pulumi's peer constraint excludes TypeScript 7.
- Replaced the embedded handwritten metrics server with readable application source and OpenTelemetry SDK metrics.
- Split app HTTP (8080) and metrics (9464); dashboard uses configured namespace.
- Private Grafana default, external-access opt-in, scoped discovery, corrected Redis ingress, hardened frontend.
- Added content checksum rollout trigger, configuration validation, offline tests, standalone books, and deterministic ZIP packaging.

## RC1 migration

Treat this as a new release candidate. Existing RC1 ZIPs remain historical artifacts. The chart upgrade from 65.1.1 to 91.5.2 spans many major versions; read every relevant upstream migration note and first validate in a disposable cluster. Do not blindly upgrade a production stack.

Existing LoadBalancer/NodePort config now requires `allowExternalGrafana=true` after review, or change it to ClusterIP. Network policies now default on. The CNI must enforce them.

`enableGrafanaDashboard` remains an alias for `enableDashboard`; the latter wins when both exist. `enableServiceMonitor` is now honored. Metric names remain the existing guestbook names, but metrics moved from HTTP port 8080 to 9464. Request latency is observed on response finish. Probes and scrapes are excluded.

Pulumi runs compiled JavaScript from lib/. Use npm run preview/up so compilation happens first. cloudProvider validates the platform name but still does not provision a cluster.

Redis is now 8.x; review upstream licensing and compatibility before organizational adoption. It remains demo-only, without persistent application data.
