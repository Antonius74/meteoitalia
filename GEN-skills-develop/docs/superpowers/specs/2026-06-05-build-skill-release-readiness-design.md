# Build Skill Release Readiness Design

## Purpose

Enhance `.codex/skills/build` from a local shareable-artifact workflow into a strict maintainer release-readiness playbook for the `GEN-skills` repository.

The skill must verify that the current enhancement set is correct, secure enough to release, consistent with repository skill rules, and ready to move through the repository's existing GitHub release automation.

## Scope

The enhanced skill keeps the existing local artifact outcome:

- `dist/codex-shareable/gen-skills-<version>.tgz`
- `dist/codex-shareable/run-codex-install.js`

It also adds a release-readiness workflow that validates the repository before any release-triggering git operation.

The skill must not edit repository version files for official releases. `package.json`, `package-lock.json`, `CHANGELOG.md`, release tags, GitHub releases, and package publication remain owned by `semantic-release` after approved code reaches `main`.

Local shareable artifacts continue to use the next available micro-version only for local testing.

## Release Boundary

Publishing must follow the repository's actual automation:

1. Approved code is present on `develop`.
2. `develop` is merged into `main`.
3. `main` is pushed to `origin/main`.
4. `.github/workflows/release.yml` runs automatically.

The skill must not run a real local publish. It must not run `npm run release` locally except through `npm run release:dry-run`.

The GitHub workflow is responsible for:

- `npm ci`
- `npm test`
- `npm run prepare`
- `npm run release`

## Human Approval Gate

The skill must never push, merge, tag, or otherwise activate release automation without explicit user approval after successful validation.

Before asking for approval, it must show a release-readiness summary:

- current branch
- clean worktree confirmation
- latest commit or commits being released
- successful validation commands
- local tarball version and paths
- release dry-run result
- target branch flow: `develop -> main`
- reminder that GitHub Actions publishes from `main`

If any validation check fails, the skill must stop before the approval prompt.

## Repository State Checks

The workflow must:

- run from the repository root or resolve the repository root before executing commands
- confirm that `origin`, `develop`, and `main` exist
- allow validation on a dirty worktree when the user is still iterating
- require a clean worktree and committed changes before publishing
- report the current branch and relevant commits before approval

If branch switching or merging would overwrite local work, the skill must stop and report a repository-state blocker.

## Validation Gate

Before release approval, the skill must require:

```bash
npm ci
git diff --check
npm audit --audit-level=moderate
npm test
npm run prepare
npm run build:codex-shareable
npm run release:dry-run
```

The existing tarball smoke tests remain required:

```bash
npm exec --yes --package /absolute/path/to/dist/codex-shareable/gen-skills-<version>.tgz -- \
  nd-gen-skills list --available
```

```bash
tmpdir=$(mktemp -d)
node /absolute/path/to/dist/codex-shareable/run-codex-install.js documentation-kit "$tmpdir"
test -f "$tmpdir/.agents/skills/documentation-kit/SKILL.md"
printf '%s\n' "$tmpdir"
```

The skill should classify failures as:

- code blocker
- security blocker
- infrastructure blocker
- repository-state blocker

`npm audit --audit-level=moderate` is a security gate. Vulnerabilities are release blockers. Registry, network, or authentication failures should be reported as infrastructure blockers rather than code failures.

## Skill Consistency Checks

The release-readiness workflow must enforce repository-specific skill rules:

- no release should modify provider skills under `packages/provider/`
- changed utility skills must stay tool-agnostic by default
- utility guidance, scripts, and examples must not hardcode Codex-only installed paths such as `.agents/skills` unless they also document equivalent Claude paths such as `.claude/skills` or use a tool-neutral placeholder such as `SKILL_DIR`
- regression coverage must be added or confirmed when utility skills include tool-specific install paths or helper-script examples

The skill should guide the agent to inspect changed files with `git diff --name-only` and targeted text search before declaring these checks passed.

## Publish Flow

After successful validation and explicit approval, the skill should perform only the git branch flow needed to activate GitHub automation:

1. Ensure release commits are on `develop`.
2. Push `develop` to `origin/develop`.
3. Switch to `main`.
4. Update `main` from `origin/main`.
5. Merge `develop` into `main` with a normal merge unless fast-forward is already possible.
6. Push `main` to `origin/main`.
7. Report that GitHub Actions is now responsible for publishing.

The skill must not create tags, edit changelogs, run semantic-release for real, or publish to npm locally.

## Error Handling

For every failed command, the skill must report:

- exact command
- blocker category
- relevant stderr or concise failure summary
- next action needed before retrying

For merge conflicts, it must stop and report the conflicting files. It must not auto-resolve conflicts.

For failed pushes, it must stop and report whether the branch is behind, authentication failed, or the remote rejected the update.

## Testing And Verification For The Skill Change

Updating `.codex/skills/build/SKILL.md` should be accompanied by focused documentation validation:

- inspect the edited skill for contradictions with `guides/install/release-process.md`
- verify it preserves the current local tarball commands and guardrails
- verify it references GitHub automation as the real publishing mechanism
- verify it does not instruct local package publication
- verify it preserves provider immutability and utility-skill portability rules

If implementation later adds scripts for this workflow, that work should get unit or integration coverage for branch-state checks, audit failure classification, artifact path reporting, and refusal to publish from a dirty worktree.
