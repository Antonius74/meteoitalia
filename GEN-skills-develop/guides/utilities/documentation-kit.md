# Documentation Kit

Use this guide when a repository needs focused documentation support with `documentation-kit`.

`documentation-kit` is the umbrella documentation utility for repository README, architecture, workflow, plan, and companion documentation flows.

## What It Installs

Install `documentation-kit` when you want one entry point for documentation work rather than adding each documentation utility separately.

It installs:

- `documentation-kit`
- `documentation-core`
- `documentation-design-kit`
- `documentation-ubiquitous-language`
- `documentation-quality-assessment`
- `agents-md-refactor`

The utility is installed as a managed skill and tracked in the tool-specific lockfile.

For Codex, files are written under `.agents/skills` and tracked in `.agents/nd-gen-skills.lock.yaml`.

For Claude, files are written under `.claude/skills` and tracked in `.claude/nd-gen-skills.lock.yaml`.

The installer also updates the managed Nexi block in root `AGENTS.md`.

## Governance Requirement

Documentation created with `documentation-kit` should follow the repository governance standard:

- [Standard: Documentation Naming and Structure - AI Engineering Governance - Confluence](../developer-distribution/documentation/AIGOV-Standard_%20Documentation%20Naming%20and%20Structure.pdf)

Use that standard as the naming and structure baseline for repository-level and local documentation before creating or refreshing docs.

## Install From The Published Package

From the target repository, install the utility for Codex:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

Install the same utility for Claude:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit --tool claude
```

Validate the managed state after install:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
```

Remove the utility when it is no longer needed:

```bash
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

For Claude removal:

```bash
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit --tool claude
```

## Install From A Local Tarball

Build the tarball from this repository:

```bash
npm ci
npm run prepare
mkdir -p dist
npm run pack
```

Set the tarball path:

```bash
TARBALL="$(ls -t "$PWD"/dist/nexidigital-nd-gen-skills-*.tgz | head -n 1)"
```

From the target repository, install the utility:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit
```

For Claude:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit --tool claude
```

## How To Use It

After install, call the utility directly when you want repository documentation work:

```text
Use $documentation-kit in this repository to refresh README.md and ARCHITECTURE.md from the current source tree.
Keep the README navigational, link existing guides, and follow the governance standard in guides/developer-distribution/documentation.
```

`documentation-kit` routes work to the right companion documentation utility when needed:

- `documentation-design-kit` for `docs/DESIGN.md` or design-to-code mapping
- `documentation-ubiquitous-language` for `docs/UBIQUITOUS_LANGUAGE.md`
- `documentation-quality-assessment` for formal documentation and `AGENTS.md` quality gates
- `agents-md-refactor` for progressive-disclosure `AGENTS.md` remediation

Assess the documentation after a refresh:

```text
Use $documentation-quality-assessment in this repository to validate README.md, ARCHITECTURE.md, docs/, and AGENTS.md.
Write the report to docs/quality/documentation-quality-assessment.md and end with the recommended provider planning prompt for fixes.
```

By default, `documentation-kit` is best for:

- `README.md`
- `ARCHITECTURE.md`
- `docs/WORKFLOW.md`
- repository or local planning documents when explicitly needed

## Recommended Flow

1. Install `documentation-kit`.
2. Confirm the target document to create or refresh.
3. Use the repository source tree as the source of truth.
4. Follow the governance PDF for naming and structure.
5. Run `validate --ci` before committing managed skill changes.

## Related Guides

- [Support utility skills](support-utility-skills.md)
- [Published package install](../install/published-package.md)
- [Local tarball install](../install/local-tarball.md)
- [Release process](../install/release-process.md)
- [Architecture](../../ARCHITECTURE.md)
