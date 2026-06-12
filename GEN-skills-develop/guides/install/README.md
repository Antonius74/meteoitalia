# Installer Guide

Use this page as the general entry point for working with the `nd-gen-skills` installer.

`@nexidigital/nd-gen-skills` is a repository installer for managed AI skills. It does not run the AI workflows itself. It resolves approved skill packages, writes them into the target repository, records ownership, and keeps the agent instruction block in sync.

## What The Installer Does

The installer turns a provider, runtime variant, contracts, and optional utilities into repository-local files for Codex or Claude.

It can:

- install a runtime for a repository type, such as `frontend-react`, `backend-java`, `mobile-ios`, or `mobile-android`;
- install a provider workflow, such as `superpowers` or `workflow-stack`;
- add or remove optional utility skills without changing the active runtime;
- sync managed skills from the packaged registry;
- validate that installed managed files still match the lockfile;
- list installed and available packages.

It writes only managed installer outputs:

| Tool | Skill root | Lockfile |
| --- | --- | --- |
| Codex | `.agents/skills` | `.agents/nd-gen-skills.lock.yaml` |
| Claude | `.claude/skills` | `.claude/nd-gen-skills.lock.yaml` |

For both tools, the installer also updates the managed Nexi block in root `AGENTS.md`. Content outside that managed block is preserved.

## How To Run It

The common path is to execute the published package with `npx` from the repository that should receive the managed skills:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

For a machine-wide CLI install, install the remote package globally:

```bash
npm install -g @nexidigital/nd-gen-skills
```

Then run the CLI from the target repository:

```bash
nd-gen-skills install --variant frontend-react
```

A plain `npm install @nexidigital/nd-gen-skills` creates a repository-local dependency. Use `-g` when the goal is to make `nd-gen-skills` available across the local machine.

For unpublished package testing, use a tarball that has already been built or provided:

```bash
TARBALL="/absolute/path/to/nexidigital-nd-gen-skills-0.1.0.tgz"
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant frontend-react
```

## Choose Provider And Variant

Every runtime install needs one provider and one variant.

| Choice | Values | Purpose |
| --- | --- | --- |
| Provider | `superpowers`, `workflow-stack` | Selects the workflow style and base skill set. |
| Variant | `frontend-react`, `backend-java`, `mobile-ios`, `mobile-android` | Selects the repository-specific runtime guidance. |

`superpowers` is the default provider. Use `workflow-stack` when the repository needs governed delivery with Jira or requirement evidence, workflow artifacts, test design, and traceable handoff.

Examples:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant backend-java
```

For Claude, pass `--tool claude`:

```bash
npx -y @nexidigital/nd-gen-skills install --tool claude --variant frontend-react
```

## Common Commands

Install or replace a runtime:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
npx -y @nexidigital/nd-gen-skills install --variant mobile-android --replace-variant
```

Refresh managed skills:

```bash
npx -y @nexidigital/nd-gen-skills sync
```

Install or remove an optional utility:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

Inspect and validate state:

```bash
npx -y @nexidigital/nd-gen-skills list
npx -y @nexidigital/nd-gen-skills list --available
npx -y @nexidigital/nd-gen-skills validate --ci
```

Add `--tool claude` to operate on the Claude skill root.

## Safety Rules

The installer is designed to avoid overwriting local work accidentally.

- It refuses to overwrite unmanaged local skill folders.
- It tracks managed file hashes in the tool lockfile.
- It rejects changed managed files unless the command supports `--force` and the user intentionally passes it.
- It requires `--replace-variant` when switching the active runtime variant.
- It updates only managed skill folders, the tool lockfile, and the managed Nexi block in `AGENTS.md`.

Run `validate --ci` in automation to detect drift without changing files.

## After Install

After installation, start normal agent work from the runtime skill recorded in `AGENTS.md`. The runtime skill knows the selected provider, variant, required contracts, and installed utilities.

Use provider skills directly only when intentionally entering a specific workflow phase, such as planning, debugging, TDD, verification, or workflow-stack orchestration.

## Detailed Guides

- [Artifactory login and install](artifactory-login.md): configure npm authentication and run the first install.
- [Published package install](published-package.md): install from the approved Artifactory package.
- [Local tarball install](local-tarball.md): install from a provided `.tgz` package archive.
- [Release process](release-process.md): maintainer release checks and automated Artifactory publishing.
- [Runtime variants](../variants.md): choose the right runtime for the repository.
- [Support utility skills](../utilities/support-utility-skills.md): install focused helper skills.
- [Architecture](../../ARCHITECTURE.md): internal installer architecture and package model.

If you are a developer who received a prebuilt tarball and do not have this repository source, use [Developer local tarball install](../developer-distribution/installation/local-tarball.md).
