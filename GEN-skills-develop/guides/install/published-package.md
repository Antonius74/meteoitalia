# Install From The Published Package

Use this guide when installing the approved package from the Nexi Artifactory npm registry with `npx`.

The package is published as `@nexidigital/nd-gen-skills` to:

```text
https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
```

Target repositories or developer machines must have authenticated npm access to the `@nexidigital` scope before running the install commands.

For first-time authentication, follow [Artifactory login and install](artifactory-login.md).

## Optional: Install The CLI Globally

Use `npx` for one-off repository installs. To install the remote package once on a developer machine and make the `nd-gen-skills` command available globally, use the npm `-g` flag:

```bash
npm install -g @nexidigital/nd-gen-skills
```

After the global install, run commands from the repository that should receive managed skills:

```bash
nd-gen-skills install --variant frontend-react
nd-gen-skills sync
nd-gen-skills validate --ci
```

A plain `npm install @nexidigital/nd-gen-skills` creates a repository-local dependency instead of a machine-wide CLI install.

## Provider And Variant Names

| Type | Name | Use case |
| --- | --- | --- |
| Provider | `superpowers` | Default lightweight workflow for design, planning, execution, TDD, review, and verification. |
| Provider | `workflow-stack` | Governed workflow for Jira or requirement evidence, workflow artifacts, and traceable delivery. |
| Variant | `frontend-react` | React frontend repositories. |
| Variant | `backend-java` | Java backend repositories. |
| Variant | `mobile-ios` | iOS repositories. |
| Variant | `mobile-android` | Android repositories. |

`superpowers` is the default provider, and `workflow-stack` is for governed Jira or evidence workflows.

## Install For Codex

Install the default Superpowers provider:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

Install Superpowers explicitly:

```bash
npx -y @nexidigital/nd-gen-skills install --provider superpowers --variant frontend-react
```

Install Workflow Stack:

```bash
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant frontend-react
```

Codex installs managed skills under `.agents/skills`, writes `.agents/nd-gen-skills.lock.yaml`, and updates the managed Nexi block in `AGENTS.md`.

## Install For Claude

Install the default Superpowers provider:

```bash
npx -y @nexidigital/nd-gen-skills install --tool claude --variant frontend-react
```

Install Workflow Stack:

```bash
npx -y @nexidigital/nd-gen-skills install --tool claude --provider workflow-stack --variant frontend-react
```

Claude installs managed skills under `.claude/skills`, writes `.claude/nd-gen-skills.lock.yaml`, and updates the managed Nexi block in root `AGENTS.md`.

## Replace An Existing Variant

Only one runtime variant should be active per tool installation. Use `--replace-variant` when switching variants:

```bash
npx -y @nexidigital/nd-gen-skills install --variant backend-java --replace-variant
```

For Claude installs, also pass `--tool claude` when replacing variants.

Use `--force` only when intentionally overwriting locally changed managed files.

## Start After Install

For normal work, start from the runtime skill recorded in `AGENTS.md`.

For direct Superpowers planning:

```text
Use $brainstorming to refine this feature idea using the installed runtime variant:
Add a saved beneficiary search filter that remembers the user's last query.
```

For direct Workflow Stack orchestration:

```text
Use $workflow-orchestration-kit to coordinate a full workflow-stack run for JIRA PROJ-101 using the installed runtime variant.
```

## Refresh And Validate

Refresh installed managed packages:

```bash
npx -y @nexidigital/nd-gen-skills sync
```

Validate installed managed state in CI:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
```

List local and available packages:

```bash
npx -y @nexidigital/nd-gen-skills list
npx -y @nexidigital/nd-gen-skills list --available
```

For Claude installs, add `--tool claude` to `sync`, `validate`, and `list`.

## Optional Utility Skills

Install or remove optional utilities without changing the runtime variant:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

For Claude installs, add `--tool claude` to `add-skill` and `remove-skill`.

For utility selection, documentation examples, dependency behavior, and local tarball equivalents, see [Support utility skills](../utilities/support-utility-skills.md).

## Related Guides

- [Installer guide](README.md)
- [Artifactory login and install](artifactory-login.md)
- [Local tarball install](local-tarball.md)
- [Release process](release-process.md)
- [Support utility skills](../utilities/support-utility-skills.md)
- [Superpowers provider](../providers/superpowers.md)
- [Workflow Stack provider](../providers/workflow-stack.md)
- [Runtime variants](../variants.md)
