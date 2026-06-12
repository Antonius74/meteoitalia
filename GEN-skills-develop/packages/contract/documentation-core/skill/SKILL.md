---
name: documentation-core
description: Shared documentation templates for repository README, architecture, workflow, plan, and design documents. Use as a source skill for documentation utilities that need stable template-backed document shapes.
---

# Documentation Core

This contract package provides reusable templates for long-lived repository documentation.
It is intentionally slim: only this index, `templates/`, and `scripts/validate.sh` belong in the package.

## Template Map

- Repository README: `templates/readme/repo.template.md`
- Local boundary README: `templates/readme/local.template.md`
- Repository architecture: `templates/architecture/repo.template.md`
- Repository workflow: `templates/workflow/repo-workflow.template.md`
- Local workflow: `templates/workflow/local-workflow.template.md`
- General plan: `templates/plan/plan.template.md`
- Execution plan: `templates/plan/execution-plan.template.md`
- Repository design mapping: `templates/design/repo.template.md`
- Local design mapping: `templates/design/local.template.md`

## Rules

- Use templates as starting points, then remove sections that do not apply.
- Prefer current repository state, executable configuration, and source files over stale prose.
- Mark unverifiable but material facts as `Needs confirmation`.
- Keep repository documentation concise, navigational, and close to the owning boundary.
- Run `bash scripts/validate.sh` after changing this package.
