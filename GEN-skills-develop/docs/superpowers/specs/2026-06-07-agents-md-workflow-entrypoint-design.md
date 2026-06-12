# AGENTS.md Workflow Entry Point Design

Date: 2026-06-07

## Context

`@nexidigital/nd-gen-skills` installs provider workflow skills, runtime skills, contracts, and utilities for Codex and
Claude. The installer already maintains a marked root `AGENTS.md` block and preserves user-authored content outside that
block.

Developers need the installed repository to explain clearly how the skills are composed without turning `AGENTS.md` into
long duplicated documentation. The generated block must remain easy to refresh during package updates and must keep
provider skill bodies untouched, especially upstream provider packages under `packages/provider/`.

## Goals

- Make the managed `AGENTS.md` block the concise repository entry point for installed Nexi skills.
- Explain how runtime, provider, contract, and utility skills compose at a high level.
- Keep the Human VCS Gate visible in the repository-level instructions.
- Add short CLI post-install and post-sync guidance that points developers to `AGENTS.md`.
- Preserve existing user-authored `AGENTS.md` content outside the managed block.
- Keep updates from previous package versions additive and non-breaking.

## Non-Goals

- Do not add prompt examples to `AGENTS.md`.
- Do not list low-value metadata such as installed tool, provider, or variant in the generated block.
- Do not duplicate provider workflow details or utility documentation in `AGENTS.md`.
- Do not create a mutating post-install skill that rewrites `AGENTS.md`.
- Do not edit provider skills under `packages/provider/`.
- Do not change the lockfile schema.

## Approved Direction

Use the installer as the only writer for the managed `AGENTS.md` block. The block should be compact but operational:

1. Name the runtime skill as the repository-level entry point.
2. Explain skill composition in a few provider-neutral bullets.
3. Keep the Human VCS Gate as repository-level behavior.
4. List installed utility skills by name and short description.
5. Omit examples and metadata that do not directly guide behavior.

CLI commands that change the installed skill set should print a short next-step reminder after success.

## Managed AGENTS.md Block

The generated block should keep the existing markers:

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

Installed utility skills:
- `skill-name`: Short description
<!-- nd-gen-skills:end -->
```

For utility-only installs, the block should still explain that the repository uses Nexi utility packages and should list
the installed utilities. Runtime-specific entry-point text should appear only when a runtime skill is installed.

## CLI Guidance

Successful install and sync commands should print the existing result line plus short next steps:

```text
Next:
- Read AGENTS.md for the managed workflow entry point.
- Start from the runtime skill listed there.
- VCS write actions require explicit user approval.
```

For utility-only add and remove commands, the wording should still point to `AGENTS.md` and the installed utility list,
without implying a runtime exists when one is not installed.

## Update Safety

The managed block remains idempotent because it is delimited by existing markers. During install, sync, add, and remove:

- The installer may replace only the marked Nexi block.
- Content before and after the managed block must be preserved.
- Existing lockfiles remain valid because no schema change is needed.
- `validate --ci` should not fail solely because a repository still has the previous managed `AGENTS.md` block shape.
- Provider package updates remain clean because provider files are not patched.
- Older managed blocks should refresh to the new compact structure when the installer rewrites `AGENTS.md`.

## Testing

Automated coverage should verify:

- Runtime installs render the compact operational `AGENTS.md` block.
- Utility-only installs do not claim a runtime entry point exists.
- Reinstall or sync refreshes an older managed block while preserving surrounding user text.
- Validation accepts the previous runtime entry sentence and the new compact runtime entry sentence.
- CLI install and sync output includes the `AGENTS.md` next-step guidance.
- Add and remove utility commands keep `AGENTS.md` accurate and use wording that fits utility-only installs.
- No provider files under `packages/provider/` are changed.

Verification after implementation should include:

```bash
npm test
npm run build
```

If registry artifacts are affected by package content changes, verification should also include:

```bash
npm run build:registry
```

## Open Decisions

No open decisions remain. The managed `AGENTS.md` block should be compact, operational, example-free, and generated only
by installer commands.
