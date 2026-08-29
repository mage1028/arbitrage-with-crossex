# Supply-chain baseline

This fork treats dependency and updater changes as security-sensitive code.

## Locked inputs

- Repository authority: `mage1028/arbitrage-with-crossex`.
- Node.js: `v24.20.0`. Both installers use embedded SHA-256 values for the
  official macOS and Windows archives instead of resolving `latest-v24.x`.
- Yarn: `1.22.22`. The manifest records the tarball SHA-256 and both installers
  verify that value before install.
- JavaScript: every direct dependency is an exact version. Transitive artifacts
  remain fixed by `yarn.lock` / `web/yarn.lock` URLs and integrity records, and
  installs use `--frozen-lockfile`.
- GitHub Actions: every `uses:` reference is a full commit SHA.
- In-app updates: the latest `main` SHA is resolved first. `version.json`, the
  installer, and the application archive are all fetched from that same SHA.

The macOS updater stages the pinned installer before execution and passes a
small environment allowlist. Gate credentials, the Boros delegated-agent key,
`DOTENV_CONFIG_PATH`, and unrelated shell variables are not inherited.

The root manifest intentionally resolves `shell-quote` to `1.9.0` because
`concurrently` requests the vulnerable exact `1.8.4`. Yarn 1 prints an
incompatible-resolution warning for that security override; the resolved API is
covered by the full test suite and `yarn audit` reports zero known advisories.

## Updating a pin

1. Work in a clean branch with no real credentials in the environment.
2. Change the exact manifest/toolchain version and its official checksum.
3. Regenerate both lockfiles using the pinned Node and Yarn versions.
4. Review every changed artifact URL, integrity value, lifecycle script, and
   GitHub Action commit before accepting the diff.
5. Run `yarn verify` and `yarn --cwd web build`.

`yarn verify:supply-chain` rejects ranged direct dependencies, mismatched Node
pins, unpinned GitHub Actions, mutable-main installer execution, and whole-env
forwarding. It is a guardrail, not proof that a pinned dependency is benign;
new versions still require code/advisory review.
