# Document Codebases With Documentation Kit

Use `documentation-kit` when a repository needs refreshed codebase documentation, a new documentation scaffold, or a check against the Nexi documentation standard in `guides/developer-distribution/documentation`.

## Install documentation-kit

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit
```

From the published package:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

## Repository-Level Scaffold

```text
<repo>/
  README.md
  ARCHITECTURE.md
  docs/
    WORKFLOW.md
    adr/
      adr-001-<name>.md
    workflows/
      workflow-functional-<name>.md
      workflow-technical-<name>.md
```

`README.md` and `ARCHITECTURE.md` are mandatory. `docs/`, `docs/WORKFLOW.md`, ADRs, workflow files, integration docs, testing docs, deployment docs, and release docs are added only when they materially improve implementation, validation, maintenance, operations, or handoff.

## Local Boundary Scaffold

```text
<feature-or-service>/
  README.md
  docs/
    WORKFLOW.md
    functional-requirement-<name>.md
    integration-<name>.md
    workflows/
      workflow-functional-<name>.md
      workflow-technical-<name>.md
```

Create local documentation only for meaningful features, services, capabilities, external integrations, unclear ownership areas, recurring ambiguity, or defect-prone boundaries.

## AGENTS.md

The installer writes a managed Nexi block in root `AGENTS.md`. Do not manually edit that managed block. Add repository-specific instructions outside the block. Agents use the managed block to discover the installed provider, runtime variant, contracts, and utilities.

## Quality Assessment

After creating or refreshing documentation, use `documentation-quality-assessment` to validate repository docs and `AGENTS.md` against the enterprise standard.

```text
Use $documentation-quality-assessment in this repository to validate README.md, ARCHITECTURE.md, docs/, and AGENTS.md.
Write the report to docs/quality/documentation-quality-assessment.md and include the recommended fix planning prompt for the installed provider.
```

## Prompt Examples

```text
Use $documentation-kit in this repository to refresh README.md and ARCHITECTURE.md from the current source tree.
Follow the documentation standard in guides/developer-distribution/documentation.
```

```text
Use $documentation-kit to scaffold repository documentation:
- README.md
- ARCHITECTURE.md
- docs/WORKFLOW.md only if repository-wide workflows exist
Keep deeper docs bounded and link to source-of-truth contracts where relevant.
```

```text
Use $documentation-ubiquitous-language to create docs/UBIQUITOUS_LANGUAGE.md from this repository and the current conversation.
Pick canonical terms, list aliases to avoid, and flag overloaded terms that need product confirmation.
```
