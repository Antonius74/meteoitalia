# Install From A Local Tarball

Use this guide when installing from a tarball that has already been built or provided.

This guide intentionally does not cover building the tarball. Maintainer build and release checks belong in [Release process](release-process.md).

## Set The Tarball Path

Set `TARBALL` to the absolute path of the provided package archive:

```bash
TARBALL="/absolute/path/to/nexidigital-nd-gen-skills-0.1.0.tgz"
printf '%s\n' "$TARBALL"
```

Use an absolute path because install commands run from the target repository.

## Install For Codex

From the target repository:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant frontend-react
```

Install Workflow Stack:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --provider workflow-stack --variant frontend-react
```

Codex installs managed skills under `.agents/skills`, writes `.agents/nd-gen-skills.lock.yaml`, and updates the managed Nexi block in `AGENTS.md`.

## Install For Claude

From the target repository:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --tool claude --variant frontend-react
```

Install Workflow Stack for Claude:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --tool claude --provider workflow-stack --variant frontend-react
```

Claude installs managed skills under `.claude/skills`, writes `.claude/nd-gen-skills.lock.yaml`, and updates the managed Nexi block in root `AGENTS.md`.

## Replace An Existing Variant

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant backend-java --replace-variant
```

For Claude:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --tool claude --variant backend-java --replace-variant
```

Use `--force` only when intentionally overwriting locally changed managed files.

## Optional Utility Skills

Add a utility skill from the same local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit
```

Remove the utility skill:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills remove-skill documentation-kit
```

For Claude installs, add `--tool claude` to `add-skill` and `remove-skill`.

For utility selection, documentation examples, and dependency behavior, see [Support utility skills](../utilities/support-utility-skills.md).

## Refresh And Validate From The Same Tarball

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills sync
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
npm exec --yes --package "$TARBALL" -- nd-gen-skills list
npm exec --yes --package "$TARBALL" -- nd-gen-skills list --available
```

For Claude installs, add `--tool claude` to `sync`, `validate`, and `list`.

## Start After Install

For normal work, start from the runtime skill recorded in `AGENTS.md`.

For direct Superpowers planning:

```text
Use $brainstorming to refine this feature idea using the installed runtime variant:
Add a saved beneficiary search filter that remembers the user's last query.
```

For a full Workflow Stack run:

```text
Use $workflow-orchestration-kit to coordinate a full workflow-stack run for JIRA PROJ-101 using the installed runtime variant.
```

## Related Guides

- [Installer guide](README.md)
- [Artifactory login and install](artifactory-login.md)
- [Published package install](published-package.md)
- [Release process](release-process.md)
- [Support utility skills](../utilities/support-utility-skills.md)
- [Superpowers provider](../providers/superpowers.md)
- [Workflow Stack provider](../providers/workflow-stack.md)
- [Runtime variants](../variants.md)
