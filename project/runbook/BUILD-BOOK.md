# Standalone Build Book

## Inputs

Obtain the matching RC2 implementation ZIP and SHA256SUMS.txt from the release owner. Confirm artifact hashes before extraction. Install Node 24.21.0 LTS with npm. No cloud login, Docker, Pulumi CLI, or Kubernetes is required to build.

## Build procedure

1. Extract 4iRDemo.zip to a new directory.
2. Enter its pulumi-k8s-guestbook-monitoring directory.
3. Check node --version and npm --version.
4. Run:

```text
npm ci --ignore-scripts
npm run check
npm run release
```

Use these same commands in PowerShell, Bash, or a macOS shell. Use dependencies installed for that OS; never copy node_modules between operating systems.

## Outputs and acceptance

release/4iRDemo.zip contains everything needed to repeat the build. release/4iRDemo-DevOps-SRE-Runbook.zip is this standalone handoff. release/SHA256SUMS.txt contains their hashes.

The implementation archive includes MANIFEST.sha256.json. The ZIP builder normalizes line endings, sorts filenames, and fixes archive timestamps. Extract a fresh copy, rebuild, and compare ZIP hashes before publishing.

PowerShell: Get-FileHash ./release/*.zip -Algorithm SHA256.
Linux: sha256sum release/*.zip.
macOS: shasum -a 256 release/*.zip.

Successful build means the compiler, offline resource/configuration tests, application metrics test, and packaging checks passed. It does not establish that the application was deployed.

## Maintenance and security

Use exact package versions and preserve package-lock.json. The current TypeScript pin is 6.0.3 because Pulumi does not accept TypeScript 7. Run npm audit after dependency changes and record the result. Review chart and Redis major upgrades before promotion. Container scanning and runtime admission remain required.

Do not add secrets, local stack configs, kubeconfig, credentials, or state to source/documentation directories. The builder omits normal secret/cache paths but cannot detect all secrets embedded in otherwise valid source.

For troubleshooting, dependency references, and detailed evidence requirements, read BUILD-BOOK.md at the root of the implementation ZIP.
