# Build Book — Human DevSecOps Engineers

## 1. Purpose and ownership

This book rebuilds RC2 from source or from an extracted implementation ZIP. Development owns application and dependency changes; security reviews dependencies, secrets, permissions, and exposure; operations validates the intended cluster and recovery procedure. Record a release owner and reviewer.

In the GitHub repository, runnable source lives in `project/`. In the original authoring workspace it lives in `build/pulumi-k8s-guestbook-monitoring/`. Inside a ZIP it is `pulumi-k8s-guestbook-monitoring/`. All scripts resolve their own location, so the extraction path can contain spaces and need not match the author's machine.

## 2. Prerequisites

- Node 24.21.0 LTS with npm; check `node --version` and `npm --version`.
- Internet access to the npm registry for the first install, or an approved registry mirror/cache containing the lockfile's packages.
- No Docker, cloud account, Pulumi CLI, kubeconfig, or administrator privileges are needed to rebuild the ZIP.
- Use PowerShell 7 on Windows; use your native shell on Linux/macOS. Do not mix Windows dependencies and WSL dependencies in one directory.

The validated dependency versions are recorded in `package.json`, `package-lock.json`, and `versions.json`. Node 24 is the current LTS choice at the recorded verification date. TypeScript 6.0.3 is the newest stable version satisfying Pulumi's peer requirement of less than 7.

## 3. Clean build

Extract the implementation ZIP into a new directory and enter its project folder.

```text
npm ci --ignore-scripts
npm run check
npm run release
```

`npm ci` enforces the committed dependency graph. Lifecycle scripts are disabled during install. The esbuild platform binary arrives as an optional package, so do not omit optional dependencies.

`npm run check` compiles Pulumi TypeScript into `lib/`, bundles the readable `app/server.cjs` and OpenTelemetry into `generated/server.cjs`, and runs the offline tests. The bundle must remain below the 900 KB ConfigMap budget. Containers run this bundle on the pinned stock Node image; they never download npm packages at startup.

`npm run release` runs those checks again, then creates both ZIPs. Avoid editing compiled files: change `src/` or `app/` and rebuild.

## 4. Review artifacts

| File | Contents |
|---|---|
| release/4iRDemo.zip | Standalone implementation, compiled runtime, source, lockfile, tests, scripts, runbooks |
| release/4iRDemo-DevOps-SRE-Runbook.zip | Standalone engineer handoff, operations, platform, build, and validation guides |
| release/SHA256SUMS.txt | SHA-256 hashes of the two ZIPs |
| MANIFEST.sha256.json inside implementation ZIP | SHA-256 for every included file except the manifest itself |

Packaging uses explicit source directories and filenames. It excludes node_modules, caches, release outputs, normal Pulumi stack files, .env files, and filesystem links. Only designated source and documentation belong in those directories; never put secrets in code or JSON documentation.

The archive has sorted entries, normalized text line endings, and a fixed timestamp. Rebuilding identical source with the locked toolchain should produce identical ZIP bytes. This is **not** a claim of hermetic deployment: chart/container downloads and mutable version tags are external inputs. Production promotion should use approved image digests and a mirrored/verified chart.

## 5. Verify a ZIP rebuild

1. Record hashes of the two release ZIPs.
2. Extract `4iRDemo.zip` into a fresh folder.
3. Run the three clean-build commands there.
4. Compare new ZIP hashes with the recorded values.
5. Inspect the manifest and archive filenames before sharing.
6. Retain dependency audit results and live deployment evidence separately, without credentials.

PowerShell hash command:

```powershell
Get-FileHash ./release/*.zip -Algorithm SHA256
```

Linux: `sha256sum release/*.zip`. macOS: `shasum -a 256 release/*.zip`.

## 6. Dependency maintenance

1. Review official npm metadata and upstream release notes.
2. Update exact versions in package.json and runtime/chart pins in versions.json.
3. Generate a new lockfile with `npm install --ignore-scripts`.
4. Run `npm run check` and `npm audit`; assess advisories, including build dependencies.
5. Review chart major-version migration notes and CRD changes. Never treat a chart major upgrade as a routine in-place production update.
6. In a disposable cluster, run preview, deploy, and the validation book; confirm metrics names and dashboard queries still match.
7. Rebuild ZIPs, compare a fresh extraction rebuild, record hashes and approval.

Official references:
- [Pulumi SDK package](https://www.npmjs.com/package/@pulumi/pulumi)
- [Kubernetes provider package](https://www.npmjs.com/package/@pulumi/kubernetes)
- [Monitoring chart upgrade notes](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md)
- [Node releases](https://nodejs.org/en/about/previous-releases)
- [OpenTelemetry exporters](https://opentelemetry.io/docs/languages/js/exporters/)

## 7. Troubleshooting

- **npm cannot find npm-cli.js:** fix the Node/npm installation or PATH. Avoid a stale user-level npm shim. No global dependency installation is required.
- **Engine warning:** use the recorded Node 24 LTS version.
- **esbuild binary missing:** install optional dependencies for the current OS; do not copy node_modules from another OS.
- **Pulumi cannot find lib/index.js:** run `npm run build`; compiled JavaScript is the configured entrypoint.
- **Build cannot read a parent directory:** check filesystem permissions; bundlers inspect parent directories when resolving modules.
- **Tests cannot bind localhost:** permit local loopback listeners in the test environment. Tests do not require public network listeners.
- **ConfigMap too large:** review added application dependencies or adopt a built application image through an approved registry workflow.

## 8. Completion evidence

Record source revision or source manifest hash, Node/npm versions, lockfile hash, test result, dependency audit disposition, archive hashes, target platform, reviewer, and live validation status. Do not mark cloud deployment as verified based only on offline tests.
