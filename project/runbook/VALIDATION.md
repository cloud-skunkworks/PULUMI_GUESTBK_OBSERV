# Validation and Engineer Handoff

## Offline acceptance

Run npm run check from the implementation project. Checks cover configuration rejection, platform defaults, custom namespace/selector wiring, network policy Redis ingress, rollout checksum, real bundled OpenTelemetry metric behavior, and archive packaging.

Run npm audit and record the date and disposition. These checks do not scan container layers, enforce Kubernetes admission, or demonstrate live cloud success.

## Live acceptance

1. Verify kubectl context, Pulumi stack, namespace ownership, and approved release.
2. Confirm rollout readiness for guestbook-frontend, redis-master, and redis-replica.
3. Confirm Prometheus, Grafana, operator, and kube-state-metrics pods are Ready.
4. Confirm monitoring/guestbook-frontend ServiceMonitor uses the app namespace and frontend service labels.
5. Port-forward frontend and Prometheus as described in OPERATIONS.md.
6. Run node scripts/validate.mjs from the implementation project. Nonzero exit means failure.
7. Query guestbook_http_requests_total, guestbook_http_request_errors_total, and guestbook_http_request_duration_seconds_bucket.
8. Generate a request to localhost:8080/error; expect HTTP 500 and an increased error count after the next scrape.
9. Open Grafana's Guestbook Overview and check request/error rate, p95 latency, CPU, memory, and restart panels. Allow at least two scrapes for rate functions.
10. Confirm no unintended public service, and test NetworkPolicy enforcement using the approved cluster security procedure.

## Data limits

Request counters reset on restart. Prometheus rate handles normal resets, but a restart during the counter-growth smoke test can make it fail; investigate and rerun after stabilizing the workload. CPU/memory/restart metrics depend on cluster scrape permissions. Redis application metrics and persistence are not supplied.

## Handoff template

- Release/ZIP hash:
- Source manifest hash:
- Node/npm and Pulumi versions:
- Target cloud, context, stack:
- Build/tests:
- Dependency audit and image scan:
- Live scrape, counter growth, dashboard:
- Private endpoint and network enforcement:
- Approved exceptions:
- Operator/reviewer/change ticket:
- Rollback owner and prior release:
- Untested platforms or remaining limitations:

Never include passwords, state files, kubeconfig, or sensitive metric payloads in handoff evidence.

## Functional smoke tests available now

Run commands from the extracted implementation project. Use the pinned Node version; install dependencies with npm ci --ignore-scripts first.

### Local application smoke test — no cluster needed

```text
npm run build
node --test tests/app.test.cjs
```

This starts the actual bundled application and OpenTelemetry exporter on loopback, makes HTTP requests, inspects exported metric values, and shuts down both listeners.

| Assertion | Expected result |
|---|---|
| GET / | HTTP 200 |
| GET /error | HTTP 500 |
| GET /unknown | HTTP 404 |
| Request counter after those requests | Exactly 3 |
| Error counter | Exactly 1 |
| Latency histogram observation count | Exactly 3 |
| Health probe and metrics scrapes before application traffic | Request counter remains 0 |

The Node test runner exits 0 on success and nonzero on assertion failure. This proves the demo's HTTP and metric behavior; it does not prove Kubernetes networking, Prometheus scraping, Grafana, or Redis persistence.

For all six existing offline checks, including configuration, resource wiring and ZIP integrity, run npm run check.

### Live deployment smoke test — running cluster required

Confirm the intended kube context, complete deployment, and start these port-forwards in separate terminals (substitute configured namespaces):

```text
kubectl -n guestbook port-forward svc/guestbook-frontend 8080:80
kubectl -n monitoring port-forward svc/prometheus-operated 9090:9090
```

Then run:

```text
node scripts/validate.mjs --app-namespace guestbook --monitoring-namespace monitoring
```

The script verifies application deployment rollout readiness, frontend ServiceMonitor namespace/label matching, at least one matching Prometheus target with all matched targets UP, and an increase in the request counter after ten HTTP requests. It prints PASS and exits 0 on success; errors print FAIL and exit nonzero. Keep the port-forwards tied to the same cluster being inspected.

Live validation has not yet been executed for this release. This script does not verify Redis read/write or replication correctness, monitoring workload readiness, Grafana login/panels, full replica target count, or network-policy enforcement. Complete the manual live acceptance checklist above and record each result separately.

### Capture reproducible evidence

Record command, exit code, date, Node version, archive SHA-256, and (for live checks) context/stack/namespaces. Save the test output in the approved handoff location without passwords or sensitive data. A green local smoke test must not be recorded as a successful live deployment.
