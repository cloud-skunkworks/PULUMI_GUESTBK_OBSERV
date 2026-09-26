# Tests

Run npm run check after npm ci --ignore-scripts. Node's built-in test runner executes:

- Configuration validation and private defaults on all supported platform labels.
- Pulumi mocks for custom namespace, service/monitor selectors, dashboard substitution, policies, and rollout checksum.
- The actual bundled OpenTelemetry server on localhost: request/error counters, latency histogram, and exclusion of probes/scrapes.
- Deterministic archive generation, manifest hashes, required files, and exclusion of usual secret/cache paths.

The mocks do not render a Helm chart or connect to Kubernetes. For runtime validation see runbook/VALIDATION.md. A dependency audit is a separate npm audit command.
