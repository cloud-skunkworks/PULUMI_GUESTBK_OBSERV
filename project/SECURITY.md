# Security Review

## Controls supplied

- Grafana, application, and metrics services default to ClusterIP.
- NodePort/LoadBalancer requires explicit `allowExternalGrafana=true` after exposure review; the flag records intent but does not replace approval, TLS, or firewall policy.
- Grafana password is required through Pulumi secret config and remains a secret output.
- Separate application and monitoring namespaces; application ingress is denied except approved scrape and Redis flows.
- Prometheus discovery and dashboard sidecar are scoped to the monitoring namespace.
- Frontend runs non-root with read-only root filesystem, dropped capabilities, no privilege escalation, no service-account token, and RuntimeDefault seccomp.
- Application metric attributes contain no request paths, bodies, identifiers, payment data, or PII.
- Package dependencies are exact and locked. Release packaging excludes usual secret/state paths and rejects symlinks.

## Permissions and boundaries

The frontend does not use the Kubernetes API. The monitoring chart requires cluster-scoped CRDs and permissions for its operator and discovery components. Review rendered resources and admission requirements before deployment; namespace isolation alone does not constrain the operator's cluster access.

NetworkPolicy requires enforcement by the CNI. DNS egress from the frontend allows TCP/UDP 53 to accommodate cluster DNS differences; narrow this to your approved resolver for production. Redis egress and the monitoring namespace are not fully isolated by this demo.

Redis is unauthenticated inside the isolated app namespace and uses ephemeral storage. It must never contain sensitive or production data. Node exporter may require host access. No PCI compliance certification is implied.

## Promotion gates

Development: build, tests, dependency/lockfile review, application behavior review.
Security: dependency audit, container scanning, image digest approval, secret handling, RBAC/CRD review, CNI enforcement test, approved endpoint exposure.
Operations: kubeconfig identity, capacity, chart compatibility, preview approval, live scrape/dashboard checks, retention/storage, rollback and cleanup ownership.

Production additionally needs approved secret-store integration, Grafana SSO/TLS, durable storage, backup/recovery, alert routing, and deployment identity scoped to the environment. Use OIDC for CI/CD; no static cloud credentials. No pipeline or cloud resources are created by this package.

Retrieve a Grafana password only in an authorized private terminal; never capture `--show-secrets` output in build or pipeline logs. Do not commit stack config, kubeconfig, .env, or Pulumi state.
