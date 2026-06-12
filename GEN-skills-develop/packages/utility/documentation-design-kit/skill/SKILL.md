---
name: documentation-design-kit
description: Create, audit, or reconcile long-lived DESIGN.md documentation for UI-bearing repositories without writing to Figma or duplicating component docs.
---

# Design Documentation Kit

Use this skill to create, audit, or reconcile long-lived `DESIGN.md` documentation for UI-bearing repositories.
The document maps Figma and design-system evidence to code components, routes, screens, and existing component documentation.

## When To Use This Package

Use this package when the user asks to:

- create or update repository `docs/DESIGN.md`
- create or update local `<boundary>/docs/DESIGN.md`
- map Figma components, frames, files, or prototypes to code components, routes, screens, or local boundaries
- audit design-to-code traceability for a frontend, mobile, or other UI-bearing repository
- reconcile design documentation after frontend or mobile implementation changes
- identify high-confidence local modules that should receive local design docs

Do not use this package for backend-only repositories with no UI-bearing evidence, implementing Figma designs in code, editing Figma files, duplicating component docs, or storing screenshots and token values.

## Hard Figma Rule

This skill may read Figma evidence, but it must never write to Figma.

Allowed when available:

- read-only design context retrieval
- read-only metadata retrieval
- read-only screenshot retrieval for verification during the run
- read-only Code Connect context, map, or suggestion retrieval

Forbidden:

- `use_figma`
- `add_code_connect_map`
- `send_code_connect_mappings`
- creating, updating, deleting, publishing, importing, or moving any Figma object
- creating or updating `.figma.ts` or `.figma.tsx` Code Connect files

If Code Connect is missing or ambiguous, report it in chat under `Need Confirmation` or `Recommended Follow-ups`.
Do not write unresolved mapping gaps into `DESIGN.md`.

## Modes

### Create Or Audit Mode

1. Identify whether the repository has UI-bearing evidence.
2. Gather Figma and local code evidence using the priority order below.
3. Create or update repository `docs/DESIGN.md` only when confidence is high enough.
4. Create or update local `<boundary>/docs/DESIGN.md` only for selected or high-confidence local page or screen boundaries.
5. Report high-confidence local doc candidates and separate `Need Confirmation` items in chat.

### Reconciliation Mode

Update `DESIGN.md` only when public design mapping changed, such as:

- a new central component was created
- a component was renamed, moved, replaced, split, or merged
- public props, variants, states, or accessibility behavior changed
- a route, page, screen, or screen-flow composition changed
- Figma, token-source, component-doc, or Code Connect references changed

Do not update `DESIGN.md` for internal-only refactors that preserve the same component, route, states, and public behavior.

## Evidence Priority

1. Figma links explicitly provided by the user, Jira, requirements, workflow artifacts, or existing docs.
2. Existing Code Connect mappings and `figma.config.json`, when present.
3. Centralized component library docs such as component-folder README files, workflow docs, story files, prop or type files, and source files.
4. Application routes, screens, pages, navigation graphs, and local feature docs.
5. Implementation plans and test-case artifacts during reconciliation mode.

Do not infer Figma mappings from screenshots or names alone unless the result stays in chat as `Need Confirmation`.

## Confidence Gate

Create or update a `DESIGN.md` file only when at least one durable mapping is high-confidence.
High-confidence evidence includes a central component library path plus verified mapped component, a Figma source plus matching code component or route, an existing Code Connect mapping plus matching code component, or a local route plus matching Figma frame or prototype.

If confidence is insufficient, do not create the file.
Ask the user for the exact component name, Figma link, target local boundary, or more context.

## Routing

- Repository design: use `../documentation-core/templates/design/repo.template.md` and write `docs/DESIGN.md`.
- Local design: use `../documentation-core/templates/design/local.template.md` and write `<boundary>/docs/DESIGN.md`.

Repository design owns central design sources, central component mappings, token-source links, and the rule for discovering local design docs.
Local design docs own page and screen composition, not central component specs.

## Output Rules

- Preserve custom sections in existing `DESIGN.md` files unless the user asks for cleanup.
- Update recognized mapping tables and related documentation links only.
- Keep unresolved ambiguity in chat, not in `DESIGN.md`.
- Include Figma links and node IDs when available.
- Include a `Code Connect` column only when existing Code Connect config or mappings are present.
- Link to token sources; do not copy token values.
- Link to component docs; do not duplicate states, variants, behavior, or TDD guidance from those docs.
- Use page or screen `E2E Coverage` only as a lightweight reference.
- Do not embed screenshots or exported design assets.
- Do not create local design docs for every route or folder automatically.

## Chat Report

At the end, report:

- `DESIGN.md` files created or updated
- verified Figma links and node IDs
- Figma links not verified because read-only tooling was unavailable
- Code Connect evidence found, omitted, or unavailable
- high-confidence local modules that could receive local design docs
- `Need Confirmation` items for ambiguous mappings
