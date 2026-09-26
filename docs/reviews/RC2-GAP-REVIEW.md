# RC2 Gap Review — 2026-09-26

The user accepted the RC2 refactor. This review identifies remaining work; it does not authorize deployment or silently expand implementation scope. RC2 is a rebuildable monitoring demo, not a completed production FinTech platform.

## Review basis

Reviewed the original SKILL requirements, current implementation, README/build books, security notes, validation scripts, tests, and recorded release evidence. Root RC1 artifacts remain historical. At the time of the review, the authoring workspace was not a Git repository. RC2 is now published separately in this GitHub repository.

The 2026-09-25 release record documents successful compilation, six tests, offline chart rendering, npm audit with zero known advisories at that time, and a clean extraction rebuild with identical hashes. The audit and version discovery were not repeated as a new current-version claim in this review. Live cloud behavior remains unverified.

## A. Missing original functionality and acceptance evidence

| ID | Priority / scope | Finding and evidence | Completion condition |
|---|---|---|---|
| G01 | High — original application objective | The frontend only returns a static page, simulated error, and health response. It never reads/writes Redis. See [app/server.cjs](../../project/app/server.cjs). | Implement and test entry creation/retrieval through Redis, or formally accept a metrics-only demo as the revised application scope. |
| G02 | High — FR-003 | Only a frontend ServiceMonitor exists; Redis service metrics are absent. Pod CPU/memory is not a Redis service scrape. See [service-monitors.ts](../../project/src/monitoring/service-monitors.ts). | Add a reviewed Redis exporter/metrics endpoint and backend ServiceMonitor, and prove its targets and metrics are available. |
| G03 | High — deployment acceptance | No live Pulumi preview/up/destroy, cluster scrape, Grafana browser, admission, or network-enforcement evidence. See [release validation](../../releases/RC2/VALIDATION.md). | Validate first on a disposable cluster, then each claimed cloud target, recording deploy, scrape, dashboard, policy, and cleanup results. |
| G04 | Medium — portability evidence | Build/rebuild has only been executed on Windows. Linux/macOS and alternate container architectures are not verified. | Run the same lockfile/build/ZIP tests on supported OS runners and validate target image architectures. |

## B. Production controls still missing

These are gaps against the supplied FinTech engineering controls, not claims that every item was required to finish the previous ZIP refactor.

| ID | Priority | Finding and evidence | Completion condition |
|---|---|---|---|
| G05 | High before production | Grafana uses an admin password. SSO/OIDC, TLS, and automated approved secret-store integration are not configured. External service output uses HTTP. See [monitoring values](../../project/src/monitoring/prometheus.ts) and [SECURITY.md](../../project/SECURITY.md). | Add SSO, approved secrets/identity integration, and protected TLS access; document emergency admin access and rotation. |
| G06 | High before production | Redis and monitoring storage are ephemeral; no backup/restore implementation or recovery drill. Redis replication does not supply durable storage or automatic failover by itself. | Configure storage, encryption and retention through approved infrastructure; define RPO/RTO and prove recovery. |
| G07 | High before production | Redis lacks configured authentication/TLS and explicit non-root/seccomp/capability restrictions in its manifests. Monitoring namespace and Redis egress are not fully isolated. Frontend DNS egress permits port 53 broadly. See [Redis resources](../../project/src/guestbook/redis-master.ts) and [policies](../../project/src/security/network-policies.ts). | Harden workload security and identity, scope necessary traffic, and test enforcement with the target CNI/admission rules. |
| G08 | Medium | No project-specific SLOs, guestbook alert rules, or notification receivers/routing. The bundled chart can supply generic rules; that is not a service-specific alerting implementation. | Add alerts as code, ownership/escalation routes, and a tested notification path. |
| G09 | Medium / broader platform scope | OTel is metrics-only and exports directly to Prometheus. No Collector, distributed traces, log pipeline, or Azure/AWS/GCP backend export configuration. | Decide required signals/backends and implement them through approved identities and endpoint configuration. |
| G10 | High before production delivery | No CI/CD pipeline, federated deployment identity, policy gates, automated secret/image scanning, SBOM, or artifact signing. Runtime images use version tags rather than immutable digests. | Add controlled build/promotion pipelines, OIDC, scans, provenance and approved digests. Keep the local build workflow available. |

## C. Incomplete implementation details and engineer-book sections

| ID | Priority | Finding | Completion condition |
|---|---|---|---|
| G11 | Medium — reproducible maintenance | [build.mjs](../../project/scripts/build.mjs) does not clean lib/ before compilation; [release.mjs](../../project/scripts/release.mjs) archives all allowed files in lib/. After deleting/renaming a source module, stale compiled files can remain in a ZIP. Identical-source rebuild tests do not exercise this case. | Safely clean only generated output or package an explicit compiler output list, then test a deleted/renamed module. |
| G12 | Medium — validation coverage | [validate.mjs](../../project/scripts/validate.mjs) checks app deployments and some Prometheus data, but not monitoring workload readiness, Grafana authentication/dashboard panels, Redis replication health, policies, or expected replica target count. The guide leaves several of these manual. The validator itself has no automated failure-path tests. | Automate the checks that can be automated, test failures, and keep remaining manual evidence explicit. |
| G13 | Medium — promotion book | Rollback instructions warn correctly about chart/CRD major changes but lack a tested migration sequence, state-backup/restore commands, backend/secrets-provider setup, and a detailed cluster-role permission inventory. | Supply environment-specific build-book procedures and a practiced rollback/recovery record before promotion. |
| G14 | Medium — acceptance traceability | Architecture lists all six TOGAF domains, but its FR/NFR mapping is abbreviated. Acceptance checklists and handoff fields remain unfilled; no named owner/status/evidence per requirement. | Add a complete requirement matrix and populate evidence only after the relevant test is executed. |
| G15 | Low — strict document structure | The standalone README and build books exist, but some README sections required by the original spec are linked out rather than present under the exact required headings. docs/operations-runbook.md, verification.md and troubleshooting.md are intentional pointers. | Decide whether linked coverage satisfies the customer rubric; if not, add concise inline sections and retain the detailed books. |
| G16 | Medium — release evidence | The validation report and outer SHA256SUMS accompany the ZIPs, but the validation report is not bundled by release.mjs or regenerated by the release command. A later rebuild could leave a stale report beside new archives. | Generate an evidence record tied to the current ZIP hashes/toolchain, with clear separation of automated and manual results. |
| G17 | Low — licensing handoff | package.json declares Apache-2.0 and NOTICE.md preserves that declaration, but no repository LICENSE file is included. | Obtain owner confirmation and include the appropriate license text and required notices. |

## D. Scope boundaries that are not missing demo requirements

- The program intentionally consumes an existing Kubernetes cluster. Missing AKS/EKS/GKE provisioning is not an original application-stack defect.
- Ingress creation is not implemented, but configurable LoadBalancer/NodePort alternatives exist; FR-006 allows alternatives. No additional public exposure is authorized.
- The repository is Pulumi-based by project design. Converting it to Terraform is a separate scope decision, not a necessary fix to this refactor.
- Private defaults, real OTel metrics, namespace-aware dashboards, pinned dependencies, human-readable books, and self-rebuilding ZIPs are already implemented.

## Recommended sequence

1. Close the stale-output packaging gap and strengthen validation failure checks.
2. Run a disposable-cluster deployment/cleanup cycle and record the acceptance results.
3. Decide whether to implement real Guestbook persistence, then close FR-003 with backend metrics.
4. Implement production identity, storage/recovery, network, alerts and pipeline controls before production promotion.
5. Complete the requirement matrix and engineer handoff with named owners and verified evidence.

This review is separate from the runnable project. It records the findings at review time; see the release validation record for later packaging updates.

## Current review verification

On 2026-09-26, npm run check passed compilation and all six tests. The tests rebuilt the ZIPs; both SHA-256 values still match the accepted RC2 release. No implementation source was changed during this gap review. No live cloud deployment or new vulnerability scan was performed.
