# Human VCS Gate Design

Date: 2026-06-05

## Context

`@nexidigital/nd-gen-skills` installs provider workflow skills, runtime skills, contracts, and utilities into Codex and
Claude repositories. Some provider workflows, especially upstream Superpowers, include instructions that commit, push,
merge, create pull requests, or clean up branches as part of normal completion.

The required Nexi behavior is different: AI skills may implement, verify, review, and summarize work, but developers
must be able to inspect the final diff before any version-control write action happens. Provider packages should remain
upstream-compatible, so this policy must not be implemented by editing upstream provider skill bodies under
`packages/provider/`.

## Goals

- Establish a provider-neutral VCS policy for all Nexi-installed workflows.
- Prevent automatic staging, commits, pushes, merges, pull request creation, branch deletion, and worktree cleanup.
- Allow read-only Git inspection commands such as `git status`, `git diff`, `git log`, and `git branch`.
- Keep implemented changes available as an unstaged working-tree diff for developer review.
- Let users explicitly request VCS write actions after reviewing the work.
- Apply the policy to Superpowers, Workflow Stack, and future providers without provider-specific source edits.
- Preserve existing installs and lockfile compatibility when updating from a previous package version.

## Non-Goals

- Do not edit provider skills under `packages/provider/`.
- Do not fork or patch upstream Superpowers skill content.
- Do not change the lockfile schema.
- Do not add a required utility skill solely for VCS policy.
- Do not remove provider workflow capabilities such as finishing, review, or orchestration.
- Do not block users from explicitly asking the agent to stage, commit, push, merge, or create a pull request.

## Approved Direction

Use a shared Human VCS Gate across Nexi-owned layers:

1. Add the authoritative policy to `nexi-workflow-contracts`.
2. Reinforce the policy in every runtime skill under `packages/variant/*/runtime/SKILL.md`.
3. Add a concise generated reminder to the managed `AGENTS.md` block.
4. Add regression coverage for installed guidance and upgrade behavior.

This keeps the policy provider-neutral and cross-tool while avoiding any edits to upstream provider skills.

## Human VCS Gate Policy

The shared contract should define these rules:

- Skills must not automatically run `git add`, `git commit`, `git push`, merge commands, pull request creation commands,
  branch deletion commands, or worktree cleanup commands.
- Skills may inspect repository state with read-only commands such as `git status`, `git diff`, `git log`, and
  `git branch`.
- Skills may modify repository files and run verification commands requested by the workflow.
- Final delivery should leave changes unstaged and report changed files, verification results, skipped checks, residual
  risk, and an optional suggested commit message.
- A VCS write action is allowed only after the user explicitly asks for that action.

The policy should be worded as a default rule for all provider workflows, contracts, runtime skills, and utilities
installed by `nd-gen-skills`.

## Provider Interaction

Runtime guidance should make provider interaction explicit:

- When a provider skill asks the agent to commit, push, merge, create a pull request, delete a branch, or clean up a
  worktree, reinterpret that instruction as verify the work, summarize the diff, and stop for developer review.
- For Superpowers, this specifically constrains `subagent-driven-development`, implementer subagents, and
  `finishing-a-development-branch` without editing upstream files.
- If a Superpowers finishing menu is reached, the default outcome is to keep the branch as-is unless the user explicitly
  requests another VCS action.
- For Workflow Stack and future providers, the same rule applies through `nexi-workflow-contracts` and runtime guidance.

This gives Nexi-owned runtime and contract instructions a stable policy layer above provider-specific workflow text.

## Installation And Generated Guidance

The installer should continue writing managed skill files and lockfiles as it does today.

The generated `AGENTS.md` block should add a concise reminder that applies after installation:

- Start with the installed runtime skill for implementation, debugging, testing, review, and maintenance.
- Leave changes unstaged and uncommitted unless the user explicitly asks for a VCS write action.

The reminder must stay inside the managed `<!-- nd-gen-skills:start -->` / `<!-- nd-gen-skills:end -->` block so updates
can refresh it without changing user-authored repository guidance outside the block.

## Upgrade Safety

Updating from an older `@nexidigital/nd-gen-skills` version must be additive and non-breaking:

- Existing managed runtime and contract skill files may be refreshed by `install` or `sync`.
- Existing user-authored `AGENTS.md` content outside the managed block must remain untouched.
- Existing lockfiles remain valid because the schema does not change.
- Existing provider packages remain upstream-compatible because provider skill bodies are not edited.
- Existing package resolution, variant selection, and utility dependency behavior remain unchanged.

Regression tests should install into a repository with an existing managed `AGENTS.md` block and surrounding user text,
then verify that the block updates with the Human VCS Gate reminder while preserving the surrounding text.

## Files To Change

Implementation should be limited to Nexi-owned files:

- `packages/contract/nexi-workflow-contracts/skill/SKILL.md`
- `packages/variant/backend-java/runtime/SKILL.md`
- `packages/variant/frontend-react/runtime/SKILL.md`
- `packages/variant/mobile-android/runtime/SKILL.md`
- `packages/variant/mobile-ios/runtime/SKILL.md`
- `src/agents-md/block.ts`
- Focused unit or integration tests covering contract, runtime, generated `AGENTS.md`, and upgrade behavior.
- Refreshed registry artifacts after package content changes.

Provider files under `packages/provider/` must not be edited for this policy.

## Testing

Automated coverage should verify:

- Installed `AGENTS.md` contains the Human VCS Gate reminder.
- User-authored text outside the managed `AGENTS.md` block survives reinstall or sync.
- `nexi-workflow-contracts` contains the no-auto-VCS policy.
- Every runtime contains provider-neutral guidance that the VCS gate applies regardless of provider.
- Superpowers-specific runtime guidance says upstream commit, push, PR, and branch cleanup instructions are gated by
  explicit user approval.

Verification after implementation should include:

```bash
npm test
npm run build:registry
```

If registry artifacts are refreshed, the final report should identify them as intentional package-output changes.

## Open Decisions

No open decisions remain. The approved policy is no automatic staging, committing, pushing, merging, PR creation, branch
deletion, or worktree cleanup for any provider, unless the user explicitly asks for that VCS write action.
