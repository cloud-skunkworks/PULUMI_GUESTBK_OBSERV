# Operations Build Book

## 1. Prepare and review

Read the platform guide, select the intended cluster, and verify your identity. Build with npm ci --ignore-scripts and npm run check. Confirm the release hash and approved Pulumi backend. The code creates namespaces and cluster-scoped monitoring resources; check for an existing operator/CRD installation before proceeding.

```text
kubectl config current-context
kubectl get nodes
pulumi login
pulumi stack init dev
pulumi config set cloudProvider local
pulumi config set --secret grafanaAdminPassword
npm run preview
```

Use stack select for an existing stack. Substitute the platform label as appropriate. Enter the password interactively from an approved secret manager. Do not log it.

Inspect namespaces, pinned images/chart, CRDs/RBAC, services, network policies, and proposed deletions/replacements. Obtain the required change approval before deployment, especially production or external endpoints.

## 2. Deploy

```text
npm run up
kubectl -n guestbook rollout status deployment/guestbook-frontend --timeout=180s
kubectl -n guestbook get pods
kubectl -n monitoring get pods
kubectl -n monitoring get servicemonitor guestbook-frontend
```

For custom namespaces replace guestbook/monitoring in manual commands. Validate the frontend service labels against the ServiceMonitor selector. The metrics port is named metrics and targets 9464.

## 3. Access privately

In separate terminals:

```text
kubectl -n guestbook port-forward svc/guestbook-frontend 8080:80
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
kubectl -n monitoring port-forward svc/prometheus-operated 9090:9090
```

Open localhost:8080, localhost:3000, and localhost:9090. Keep forwarding bound to localhost. Grafana admin user is a stack output; obtain its secret password only in an authorized private terminal. The dashboard is named **Guestbook Overview**.

Direct metrics diagnosis:

```text
kubectl -n guestbook port-forward svc/guestbook-frontend 9464:9464
```

Open localhost:9464/metrics. The application HTTP port no longer serves metrics.

## 4. Validate and record

Follow VALIDATION.md. Within the implementation project, the portable validator is:

```text
node scripts/validate.mjs --app-namespace guestbook --monitoring-namespace monitoring
```

It checks the selected cluster, ready deployments, monitor wiring, and frontend targets using localhost Prometheus. It generates demo HTTP traffic and checks request-counter growth. It does not install, patch, delete, or reveal secrets.

Record release/manifest hash, target/context, stack, time, operator, preview approval, validation results, dashboard screenshot, security exceptions, and rollback owner. Mark any untested platform as unverified.

## 5. Diagnose

| Symptom | Check and response |
|---|---|
| No scrape target | Service labels, ServiceMonitor namespace selector, release=kps label, configured namespaces |
| Target DOWN | Port 9464, /metrics, pod readiness, CNI and scrape policy |
| Dashboard empty | Prometheus data source, namespace in provisioned queries, generated traffic, time range |
| External IP pending | Prefer private port-forward; inspect controller, subnet, quota, and reviewed annotations |
| Node exporter rejected | Review admission/host permissions; disable enableNodeExporter only with documented metric limitation |
| Frontend source change ignored | Rebuild; checksum/server annotation should change and trigger rollout |
| Preview fails before resources | Run npm run build; confirm Helm renderer, kubeconfig identity, backend, required secret |
| CRD upgrade problem | Stop promotion, review upstream migration procedure, recover from approved backup/change plan |

Do not use manual helm install or kubectl apply to create resources managed by this program.

## 6. Rollback

Preserve the prior implementation ZIP, source manifest, and Pulumi state backup securely. For an application-only regression, restore the prior reviewed source, rebuild, preview, and apply through Pulumi.

Chart/CRD or Redis major changes may not support downgrade. Consult upstream migration guidance and the platform recovery plan; a generic git revert is not a safe guarantee. Prefer a disposable validation stack before any major upgrade.

## 7. Decommission

For an approved disposable stack:

```text
pulumi stack select dev
pulumi destroy
```

Review the destroy preview before confirmation. Verify namespace/resources removal and any external load-balancer or disk cleanup. Do not delete an entire cluster/resource group as part of this package's cleanup. Remove the Pulumi stack only after state/resource reconciliation and required record retention.

## 8. Recommended sequence

This is the remaining-work plan. Items stay open until their completion evidence is recorded; listing them does not mean they have been implemented or tested.

1. Close the stale-output packaging gap and strengthen validation failure checks.
2. Run a disposable-cluster deployment/cleanup cycle and record the acceptance results.
3. Decide whether to implement real Guestbook persistence, then close FR-003 with backend metrics.
4. Implement production identity, storage/recovery, network, alerts and pipeline controls before production promotion.
5. Complete the requirement matrix and engineer handoff with named owners and verified evidence.

| Step | Suggested responsible role | Completion evidence | Status |
|---|---|---|---|
| 1 | Build engineer / QA | Deleted-module packaging regression and validator failure-path tests pass | Open |
| 2 | Platform engineer / SRE | Approved disposable target; deploy, scrape, dashboard, policy and cleanup results | Open |
| 3 | Application engineer / observability engineer | Recorded persistence scope decision; backend metrics and ServiceMonitor verified | Open |
| 4 | Security engineer / platform engineer | Reviewed production controls, recovery drill, alert delivery and pipeline gate evidence | Open |
| 5 | Release owner | Complete FR/NFR matrix with named owners, reviewers and evidence links | Open |

Assign named owners in the handoff before execution. See [VALIDATION.md](VALIDATION.md) for existing functional smoke tests and their limits. Deployment and production promotion still follow the approval requirements in this book.
