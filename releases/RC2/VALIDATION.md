# RC2 Publication Validation — 2026-09-26

This publication introduces the project/, docs/, and releases/RC2/ repository layout and a human navigation README. Application behavior is unchanged from the reviewed RC2 baseline. Documentation path guidance and whitespace were adjusted for publication.

Executed in the GitHub publication checkout on Windows using Node 24.21.0:

- npm ci --ignore-scripts: PASS.
- npm run release: PASS (compilation, bundle, six automated tests, ZIP generation).
- Local functional smoke test: PASS (HTTP 200/500/404, request/error/latency counters, excluded probe/scrape traffic).
- Deterministic ZIP and manifest integrity checks: PASS.
- Staged-path and basic credential-signature checks: PASS. These are not a full security audit.
- Documentation links: checked against the publication layout.

Current ZIP hashes are recorded in SHA256SUMS.txt beside this document. The implementation ZIP also includes MANIFEST.sha256.json covering its contents.

Earlier RC2 evidence recorded a fresh-extraction rebuild, offline Helm chart rendering and npm audit on 2026-09-25. The Helm render and audit were not repeated for this publication-only update.

Not verified: live cloud deployment, Kubernetes admission, Grafana browser behavior, Redis persistence, policy enforcement, Linux/macOS execution, container scans, or production readiness. See the operations playbook and gap review.
