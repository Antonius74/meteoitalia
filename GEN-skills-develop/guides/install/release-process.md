# Release Process

Use this guide when maintaining the published `@nexidigital/nd-gen-skills` package.

Releases are automated from `main` with GitHub Actions and `semantic-release`. Maintainers should not publish the package manually from a workstation.

## Release Inputs

Semantic release reads conventional commits on `main` and decides whether to publish a new version.

Common release-driving prefixes are:

- `feat:` for a minor release
- `fix:` for a patch release
- `perf:` for a patch release
- `BREAKING CHANGE:` in the commit body for a major release

Non-release changes such as `docs:`, `test:`, `build:`, and `chore:` can still appear in release notes depending on semantic-release output, but they do not normally trigger a package version by themselves.

## GitHub Actions Flow

The release workflow runs on pushes to `main`.

It performs:

1. `npm ci`
2. `npm test`
3. `npm run prepare`
4. `npm run release`

`npm run prepare` builds the TypeScript output and regenerates the bundled `dist-registry` artifacts before semantic-release publishes the package.

## Artifactory Publishing

The package is published to the Nexi Artifactory npm registry configured in `.npmrc`:

```text
https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
```

The GitHub repository must define the `ARTIFACTORY_NPM_TOKEN` secret. The release workflow passes that secret as both `NPM_TOKEN` and `NODE_AUTH_TOKEN` for npm publish.

## Local Release Checks

Before merging release-impacting work, run:

```bash
npm ci
npm test
npm run prepare
npm run release:dry-run
```

The dry run verifies semantic-release analysis, notes generation, and publish readiness without publishing to Artifactory.

## Local Tarball Checks

Use a local tarball only for target-repository testing before a release:

```bash
npm ci
npm run prepare
mkdir -p dist
npm run pack
```

Then follow [Local tarball install](local-tarball.md) from the target repository.

## Related Guides

- [Installer guide](README.md)
- [Artifactory login and install](artifactory-login.md)
- [Published package install](published-package.md)
- [Local tarball install](local-tarball.md)
- [Architecture](../../ARCHITECTURE.md)
