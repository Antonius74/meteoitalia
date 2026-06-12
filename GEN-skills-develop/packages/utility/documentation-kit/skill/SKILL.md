---
name: documentation-kit
description: Create or refresh repository README, architecture, workflow, plan, design, and ubiquitous language documentation using the documentation-core templates and companion documentation utilities.
---

# Documentation Kit

Use this skill as the umbrella entry point for repository documentation work backed by the installed `documentation-core` template library.
Route design-to-code documentation to `documentation-design-kit`.
Route repository terminology and DDD glossary work to `documentation-ubiquitous-language`.
Route documentation and `AGENTS.md` quality gates to `documentation-quality-assessment`.
Route `AGENTS.md` restructuring to `agents-md-refactor`.

## First Questions

Before writing or rewriting any document, identify:

- the repository path to scan
- the document to create or update

Use the repository path as the starting point for an evidence scan.
Inspect the top-level structure, meaningful boundaries, manifests, scripts, CI, canonical docs, and source or test entry points relevant to the selected document.
Do not blindly read every file.

## Ambiguity Challenge

Before drafting, use the installed `grill-me` skill to challenge assumptions about scope, ownership, terminology, commands, links, and maintenance expectations.
If a question can be answered by inspecting repository files, inspect the repository instead of asking the user.
Stop questioning only when material uncertainty is resolved, explicitly marked `Needs confirmation`, or not material to the selected document.

## Default Document Sequence

If the user does not specify the document type, select the next useful document in this order:

- repository `README.md`
- repository `ARCHITECTURE.md`
- repository `docs/WORKFLOW.md` when a repository-wide workflow is materially useful
- repository `docs/UBIQUITOUS_LANGUAGE.md` when domain terminology or DDD language is explicitly requested
- local `README.md` for a meaningful boundary discovered during the scan
- local `docs/WORKFLOW.md` when that boundary has a non-obvious recurring workflow
- general plan or execution plan only when the work is time-bound and active

Do not select `docs/DESIGN.md` by default.
Route it only when the user asks for design mapping, Figma-to-code documentation, UI component mapping, prototype traceability, or `DESIGN.md`.

## Routing

- Repository README: `../documentation-core/templates/readme/repo.template.md`
- Local boundary README: `../documentation-core/templates/readme/local.template.md`
- Repository architecture: `../documentation-core/templates/architecture/repo.template.md`
- Repository workflow: `../documentation-core/templates/workflow/repo-workflow.template.md`
- Local workflow: `../documentation-core/templates/workflow/local-workflow.template.md`
- General plan: `../documentation-core/templates/plan/plan.template.md`
- Stepwise implementation plan: `../documentation-core/templates/plan/execution-plan.template.md`
- Repository ubiquitous language glossary: use `documentation-ubiquitous-language` and write to `docs/UBIQUITOUS_LANGUAGE.md`.
- Repository or local design mapping: use `documentation-design-kit`.
- Documentation and `AGENTS.md` quality assessment: use `documentation-quality-assessment` and write the default report to `docs/quality/documentation-quality-assessment.md`.
- `AGENTS.md` progressive-disclosure remediation: use `agents-md-refactor`.

## Working Rules

- Prefer filesystem state and executable configuration over existing prose.
- Apply repository-local documentation rules when present.
- Use `Needs confirmation` only for unresolved points that are materially useful and cannot be verified from the scan.
- Remove sections, rows, links, and commands that do not apply.
- Keep repository docs concise and navigational.
- Create local docs only for meaningful boundaries with real ownership, constraints, or workflow value.
- Keep plans time-bound; do not use them as substitutes for permanent architecture or operating documentation.
- When multiple documents are needed, write them one at a time in the selected sequence.
- If current docs conflict with code, commands, or structure, follow the current repo state and note the mismatch briefly.
