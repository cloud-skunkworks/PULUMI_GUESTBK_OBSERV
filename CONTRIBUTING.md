# Engineer Workflow

## Change the right source

Application code lives in project/app/. Infrastructure code lives in project/src/.
Dashboard JSON lives in project/dashboards/. Human documentation lives in project/runbook/ and project/docs/.
Original specifications in docs/specifications/ describe the design; the review records remaining gaps.

Do not edit generated JavaScript or unpacked dependencies. Keep changes focused and keep metric names, selectors, ports, namespace settings, and books consistent.

## Validate

From project/:

```text
npm ci --ignore-scripts
npm run check
npm run release
```

Use the Node version in project/versions.json. Preserve package-lock.json and exact dependencies. Run npm audit when changing dependencies; review container/chart changes separately. Do not treat mocks as evidence of cluster deployment.

## Publish a reviewed release

1. Review the source changes and the remaining-work record.
2. Run the build/tests and inspect the resulting ZIP contents and manifest.
3. Copy the two ZIPs and SHA256SUMS.txt from project/release/ to the intended releases/RCx/ directory.
4. Write a validation record tied to those hashes; distinguish newly executed checks from historical results.
5. Update the root README download links if the release directory changes.
6. Commit source, books, and reviewed artifacts together and use the repository's review process.

Do not overwrite historical release directories for a new release candidate. Do not publish node_modules, local caches, generated source directories, stack config, state, kubeconfig, or credentials. Never put secrets in otherwise allowed source/JSON files.

## Deployment

Publishing source does not deploy infrastructure. Follow the operations playbook, preview the target stack, and obtain required environment approvals. Public application exposure needs explicit approval even though this code repository is public.

## Known limitations

See docs/reviews/RC2-GAP-REVIEW.md and the recommended sequence in project/runbook/OPERATIONS.md. Do not mark items complete without named owners and evidence.
