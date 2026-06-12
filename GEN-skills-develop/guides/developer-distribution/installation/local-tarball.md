# Install From A Local Tarball

## Prerequisites

- Node.js 20 or newer.
- npm.
- Codex.
- A target repository where skills should be installed.
- A prebuilt `nexidigital-nd-gen-skills-*.tgz` package archive.

## Set The Tarball Path

```bash
TARBALL="/absolute/path/to/nexidigital-nd-gen-skills-0.1.0.tgz"
printf '%s\n' "$TARBALL"
```

Use an absolute path because commands run from the target repository.

## Install The Default Superpowers Setup

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant frontend-react
```

## Choose Another Variant

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant backend-java
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant mobile-ios
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant mobile-android
```

## Install Workflow Stack When Needed

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Replace An Existing Variant

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant backend-java --replace-variant
```

## Validate And Inspect

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
npm exec --yes --package "$TARBALL" -- nd-gen-skills list
npm exec --yes --package "$TARBALL" -- nd-gen-skills list --available
```

## Common Problems

- Use an absolute `TARBALL` path.
- Run commands from the target repository, not from the folder that stores the tarball.
- Use `--replace-variant` when switching runtime variants.
- Use `--force` only when intentionally overwriting changed managed files.
