# 4IR RC2 — Standalone DevSecOps Engineer Runbooks

Use these books with the RC2 `4iRDemo.zip` implementation package. This runbook ZIP can be read independently; it does not include dependencies or deployable source.

| Responsibility | Book |
|---|---|
| Developer / release engineer | [Build and rebuild](BUILD-BOOK.md) |
| Platform / operations engineer | [Deployment and recovery](OPERATIONS.md) |
| Cloud engineer | [Platform prerequisites](PLATFORMS.md) |
| QA / SRE / security reviewer | [Validation and evidence](VALIDATION.md) |

Architecture: a demo Node frontend emits OpenTelemetry metrics; Prometheus scrapes port 9464; Grafana displays application and pod metrics. Redis master/replicas are demo backend workloads, not connected to frontend storage.

Private access and distinct namespaces are the defaults. The application is not production-ready or a PCI-certified payment service. Installation requires a pre-existing cluster and approved permissions.

The source project README, BUILD-BOOK, SECURITY, configuration reference, and CHANGELOG provide further implementation details.
