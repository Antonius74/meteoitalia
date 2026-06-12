# AGENTS.md Utility Inventory Removal Design

Date: 2026-06-10

## Context

`@nexidigital/nd-gen-skills` installs managed provider workflow skills, runtime skills, contracts, and utilities for
Codex and Claude. The installer writes a marked root `AGENTS.md` block and preserves user-authored content outside the
managed markers.

The current generated block includes a `Skill composition:` explanation and an `Installed utility skills:` inventory with
utility names and descriptions. The inventory is not a stable instruction contract: it changes whenever utilities are
added, removed, renamed, reworded, or made transitive. That makes the generated `AGENTS.md` harder to version and causes
validation to depend on prose that duplicates lockfile state.

## Goals

- Remove the generated installed utility inventory from `AGENTS.md`.
- Keep `Skill composition:` because it explains how runtime, provider, repository, and utility instructions interact.
- Keep the Human VCS Gate visible in repository-level managed instructions.
- Preserve user-authored `AGENTS.md` content outside the managed block.
- Keep validation focused on stable generated anchors rather than utility inventory prose.
- Avoid changes to provider skills under `packages/provider/**`.

## Non-Goals

- Do not remove the managed `AGENTS.md` block for utility-only installs.
- Do not remove the runtime entry point from runtime installs.
- Do not change the lockfile schema.
- Do not make `AGENTS.md` the source of truth for installed utility state.
- Do not add links to external or repository docs from generated target-repository `AGENTS.md` blocks.

## Approved Direction

Use the installer as the only writer for the marked Nexi block. The generated block remains operational and conceptual,
but no longer lists installed utility skills.

Runtime installs should render:

```md
<!-- nd-gen-skills:start -->
## Nexi AI Skills

Runtime entry point:
- Start with `nexi-...-runtime` for implementation, debugging, testing, review, and maintenance.

Skill composition:
- The runtime skill is the repository-level entry point.
- Provider skills guide workflow phases.
- Utility skills add focused capabilities.
- Repository instructions and this managed block override provider instructions when they conflict.

Human VCS Gate:
- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.
- Read-only Git inspection is allowed.
- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.
<!-- nd-gen-skills:end -->
```

Utility-only installs should render:

```md
<!-- nd-gen-skills:start -->
## Nexi AI Skills

Skill composition:
- Utility skills add focused capabilities.
- Repository instructions and this managed block override installed skill instructions when they conflict.

Human VCS Gate:
- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.
- Read-only Git inspection is allowed.
- Do not push, merge, rebase, cherry-pick, create pull requests, delete branches, or clean worktrees without explicit approval.
<!-- nd-gen-skills:end -->
```

No generated block should contain `Installed utility skills:` or utility name/description bullets.

## Architecture

`src/agents-md/block.ts` remains the single renderer for the generated block. The existing marker-based
`upsertAgentsBlock` behavior remains unchanged, so installs, syncs, add-skill operations, and remove-skill operations
continue to replace only the managed Nexi block.

`AgentsBlockInput.utilities` can remain in the renderer input for compatibility with existing callers, but rendering
should ignore utility names and descriptions. The lockfile and managed files remain the authoritative installed utility
state.

## Validation

`validate` should continue to require a managed `AGENTS.md` block when a runtime or utility is installed. It should still
check:

- the managed block markers exist;
- the block contains `## Nexi AI Skills`;
- runtime installs include an accepted runtime entry sentence.

`validate` should stop checking for utility bullets in `AGENTS.md`. Utility correctness remains covered by existing
lockfile, package resolution, managed skill, managed file, and hash validation.

Backward compatibility should remain for the previous runtime sentence already accepted by validation. Older blocks that
still list utilities may continue to validate as long as they satisfy the stable heading and runtime checks, and they
will refresh to the new shape the next time the installer rewrites the block.

## CLI Guidance

Runtime install and sync output can keep pointing users to `AGENTS.md` as the managed workflow entry point.

Utility add and remove output should stop referring to a managed utility skill list. Use wording such as:

```text
Next:
- Read AGENTS.md for repository-level managed instructions.
- Use installed utility skills only when the current workflow calls for them.
- VCS write actions require explicit user approval.
```

## Testing

Automated coverage should verify:

- runtime block rendering keeps the runtime entry point, `Skill composition:`, and Human VCS Gate;
- runtime block rendering omits `Installed utility skills:` and utility bullets;
- utility-only block rendering keeps utility composition guidance and Human VCS Gate;
- utility-only block rendering omits `Installed utility skills:` and utility bullets;
- reinstall or sync refreshes an older block while preserving user-authored text outside the markers;
- validation passes for installed utilities when the managed block does not list utilities;
- CLI add-skill and remove-skill output no longer mentions a managed utility skill list;
- no files under `packages/provider/**` are modified.

Verification after implementation should include:

```bash
npm test
npm run build
```

Registry artifacts should not change for this renderer-only behavior. If implementation unexpectedly changes package
content, also run:

```bash
npm run build:registry
```

## Risks

Removing utility bullets from `AGENTS.md` reduces immediate local visibility into which utility skills are installed.
This is intentional: installed utility state belongs in the lockfile and installed skill folders, while generated
`AGENTS.md` should stay stable and behavior-oriented.

The main compatibility risk is validation that previously treated utility bullets as required evidence. The mitigation
is to remove that prose dependency and rely on existing managed file and lockfile validation.

## Open Decisions

No open decisions remain. Keep `Skill composition:`, remove the installed utility inventory, and preserve the managed
block for both runtime and utility-only installs.
