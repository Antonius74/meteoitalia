# Build Skill Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `.codex/skills/build/SKILL.md` so the build skill validates release readiness, preserves local tarball generation, and gates the `develop -> main` GitHub automation trigger behind explicit user approval.

**Architecture:** This is a documentation/skill-guidance change only. The build skill remains a Codex-local playbook; official release versioning and publication remain owned by `semantic-release` and `.github/workflows/release.yml` after `main` is pushed.

**Tech Stack:** Markdown skill guidance, npm scripts, Git, GitHub Actions, semantic-release, Vitest, Node/npm tarball smoke tests.

---

## File Structure

- Modify `.codex/skills/build/SKILL.md`: expand the existing local artifact workflow into a two-phase release-readiness playbook.
- Read `guides/install/release-process.md`: source of truth for maintainer release checks.
- Read `.github/workflows/release.yml`: source of truth for what happens after pushing `main`.
- Read `docs/superpowers/specs/2026-06-05-build-skill-release-readiness-design.md`: approved design.
- No source, registry, package, or provider-skill files should be changed.

### Task 1: Preserve Existing Build Contract While Reframing The Skill

**Files:**
- Modify: `.codex/skills/build/SKILL.md`
- Reference: `docs/superpowers/specs/2026-06-05-build-skill-release-readiness-design.md`

- [ ] **Step 1: Read the current build skill**

Run:

```bash
sed -n '1,220p' .codex/skills/build/SKILL.md
```

Expected: the current skill describes local shareable artifact output, next micro-version behavior, tarball smoke tests, return values, and guardrails.

- [ ] **Step 2: Replace `.codex/skills/build/SKILL.md` with the enhanced skill guidance**

Use this complete file content:

```markdown
---
name: build
description: Use when asked to build, verify, or release-check the next shareable GEN-skills artifact, or when preparing approved GEN-skills enhancements for the develop-to-main GitHub release automation.
---

# Build

Use this skill only inside the `GEN-skills` repository.

This skill has two modes:

1. **Local artifact verification:** build and smoke-test the next available shareable Codex npm tarball.
2. **Release readiness:** validate that committed enhancements are correct, secure enough to release, consistent with repository skill rules, and ready to move from `develop` into `main`.

The release readiness path must always preserve the repository's actual release model: GitHub Actions publishes from `main`. Do not publish from the local workstation.

## Outcomes

For local artifact verification, produce these files under `dist/codex-shareable/`:

- `gen-skills-<version>.tgz`
- `run-codex-install.js`

The `.tgz` is the real cross-platform shareable artifact for macOS and Windows. The runner script is only a convenience wrapper around `npm exec`.

Do not describe a single native executable as working on both macOS and Windows. For this workflow, the cross-platform deliverable is the npm tarball.

For release readiness, produce:

- a concise validation summary
- the local tarball version and paths
- the release dry-run result
- a clear go/no-go recommendation
- an explicit user approval prompt before any push or merge

## Preconditions

- Run from the repository root. If needed, resolve it with `git rev-parse --show-toplevel`.
- Require Node 20+ and `npm`.
- Resolve those executables before building. If the active Codex shell exposes `node` but not `npm`, use a real Node/npm toolchain by prepending its `bin` directory to `PATH` or by calling the npm executable directly.
- Keep the workspace manifest version unchanged unless the user explicitly asks to edit repository versioning.
- This workflow builds the next available local shareable micro version by default. Use the build script `--version` override only when the user explicitly asks for a specific shareable artifact version.
- Do not edit `package.json`, `package-lock.json`, `CHANGELOG.md`, release tags, or GitHub releases for official versioning. Official release versioning belongs to `semantic-release`.

## Repository State Checks

Before release-readiness validation, inspect repository state:

```bash
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git branch --list develop main
git branch --all --list 'origin/develop' 'origin/main'
git log --oneline -5
```

Rules:

- Validation may run on a dirty worktree while the user is still iterating.
- Publishing must start from a clean worktree with committed changes.
- `origin`, `develop`, and `main` must exist before any publish flow.
- If branch switching or merging would overwrite local work, stop and report a repository-state blocker.

## Validation Gate

Before asking for approval to merge `develop` into `main`, run:

```bash
npm ci
git diff --check
npm audit --audit-level=moderate
npm test
npm run prepare
npm run build:codex-shareable
npm run release:dry-run
```

Classify failures:

- **code blocker:** build, test, prepare, dry-run logic, or smoke-test failures caused by repository behavior
- **security blocker:** `npm audit --audit-level=moderate` reports vulnerabilities
- **infrastructure blocker:** registry, network, npm authentication, GitHub authentication, or remote availability failures
- **repository-state blocker:** dirty worktree at publish time, missing branches/remotes, branch divergence, merge conflicts, or unsafe branch switching

If a command fails, report the exact command, the blocker category, the relevant stderr or concise failure summary, and the next action needed before retrying. Stop before any approval or publish step.

## Skill Consistency Checks

Before release approval, inspect changed files:

```bash
git diff --name-only origin/main...HEAD
git diff --name-only -- packages/provider/
rg -n "\\.agents/skills|\\.claude/skills|SKILL_DIR" packages/utility .codex/skills docs guides README.md
```

Rules:

- Do not release changes that modify provider skills under `packages/provider/`; they are upstream skills and should stay consistent through provider package updates.
- Utility skills must stay tool-agnostic by default.
- Utility guidance, scripts, and examples must not hardcode Codex-only installed paths such as `.agents/skills` unless they also document equivalent Claude paths such as `.claude/skills` or use a tool-neutral placeholder such as `SKILL_DIR`.
- Add or confirm regression coverage when utility skills include tool-specific install paths or helper-script examples.

The generated Codex runner smoke test may check `.agents/skills/...` because `run-codex-install.js` is explicitly fixed to Codex and always passes `--tool codex`.

## Build Local Shareable Artifact

Use the next available shareable micro version without editing repository version files:

```bash
npm run build:codex-shareable
```

Equivalent direct command:

```bash
npx tsx scripts/build-codex-shareable.ts --next-version
```

Use an explicit shareable version override only when the user requested it:

```bash
npx tsx scripts/build-codex-shareable.ts --version 0.7.5
```

This writes the share bundle to:

- `dist/codex-shareable/gen-skills-<version>.tgz`
- `dist/codex-shareable/run-codex-install.js`

## Smoke Test The Artifact

Smoke-test the packaged executable from the generated tarball before using the runner. This catches npm bin installation problems directly:

```bash
npm exec --yes --package /absolute/path/to/dist/codex-shareable/gen-skills-<version>.tgz -- \
  nd-gen-skills list --available
```

Smoke-test the generated runner against a temporary target repository:

```bash
tmpdir=$(mktemp -d)
node /absolute/path/to/dist/codex-shareable/run-codex-install.js documentation-kit "$tmpdir"
test -f "$tmpdir/.agents/skills/documentation-kit/SKILL.md"
printf '%s\n' "$tmpdir"
```

If the task is build-only and the repo has not changed since the last verified run, you may skip the full suite only if the user explicitly wants speed over validation. Keep the smoke test.

## Approval Gate Before Publishing

After all validation and smoke tests pass, summarize:

- current branch
- clean worktree confirmation
- latest commit or commits being released
- successful validation commands
- local tarball version and paths
- release dry-run result
- target branch flow: `develop -> main`
- reminder that GitHub Actions publishes from `main`

Ask the user directly whether to proceed. Do not push, merge, tag, or otherwise activate release automation without explicit approval.

## Publish Flow After Approval

After explicit user approval, perform only the git branch flow needed to activate GitHub automation:

```bash
git status --short --branch
git switch develop
git pull --ff-only origin develop
git push origin develop
git switch main
git pull --ff-only origin main
git merge develop
git push origin main
```

If a fast-forward merge is possible, using it is acceptable. If Git reports conflicts, stop and report the conflicting files. Do not auto-resolve conflicts.

Do not create tags, edit changelogs, run `npm run release` for real, or publish to npm locally. Pushing `main` activates `.github/workflows/release.yml`, which runs:

1. `npm ci`
2. `npm test`
3. `npm run prepare`
4. `npm run release`

## What To Return

For local artifact verification, always give the user:

- the absolute path to the built `.tgz`
- the absolute path to `run-codex-install.js`
- the build version used
- the exact pure npm install command
- the runner command if helpful

Pure npm command shape:

```bash
cd /path/to/target-repo
npm exec --yes --package /absolute/path/to/dist/codex-shareable/gen-skills-<version>.tgz -- \
  nd-gen-skills add-skill <utility-skill> --tool codex
```

Runner command shape:

```bash
node /absolute/path/to/dist/codex-shareable/run-codex-install.js <utility-skill> /path/to/target-repo
```

Mention that the runner is for utility skills, is fixed to Codex, and always uses `--tool codex`.
Also mention that the runner delegates to `npm exec`, so npm must be available in the runtime PATH; otherwise use the pure npm command with a resolved npm executable or fix PATH first.

For release readiness, return:

- the validation result
- blocker category and failed command if blocked
- local artifact paths and version if built
- release dry-run status
- whether the user approved publishing
- after approval, whether `develop` and `main` were pushed
- that GitHub Actions is responsible for the actual package publication

## Guardrails

- Do not switch this workflow to PyInstaller when the user asks for a shareable artifact that must work on both macOS and Windows.
- Do not claim the runner itself is the shareable package; the tarball is the distributable artifact.
- Do not silently change the repository version just to emit a one-off bundle version.
- Do not publish to npm locally.
- Do not run `npm run release` locally except as `npm run release:dry-run`.
- Do not trigger release automation without explicit user approval after successful validation.
- Do not proceed with publishing from a dirty worktree.
- Do not auto-resolve merge conflicts.
- If build, validation, audit, dry run, or smoke test fails, report the concrete failing command and stop after summarizing the blocker.
```

- [ ] **Step 3: Confirm the existing artifact contract is still present**

Run:

```bash
rg -n "dist/codex-shareable|gen-skills-<version>\\.tgz|run-codex-install\\.js|npm run build:codex-shareable|nd-gen-skills list --available|documentation-kit" .codex/skills/build/SKILL.md
```

Expected: every searched term appears in the enhanced skill.

### Task 2: Verify Release Boundary Against Repository Automation

**Files:**
- Read: `.github/workflows/release.yml`
- Read: `guides/install/release-process.md`
- Verify: `.codex/skills/build/SKILL.md`

- [ ] **Step 1: Inspect GitHub release automation**

Run:

```bash
sed -n '1,120p' .github/workflows/release.yml
```

Expected: workflow runs on push to `main` and performs `npm ci`, `npm test`, `npm run prepare`, and `npm run release`.

- [ ] **Step 2: Inspect release process docs**

Run:

```bash
sed -n '1,90p' guides/install/release-process.md
```

Expected: docs state releases are automated from `main`, maintainers should not publish manually, and local checks include `npm run release:dry-run`.

- [ ] **Step 3: Verify the build skill does not instruct local publication**

Run:

```bash
rg -n "publish to npm locally|publish from the local workstation|npm run release|release:dry-run|origin main|develop" .codex/skills/build/SKILL.md
```

Expected:

- matches explicitly forbid local publish
- `npm run release` appears only as a prohibition or as part of GitHub Actions responsibilities
- local execution uses `npm run release:dry-run`
- publish flow pushes `develop` and `main`, then leaves publication to GitHub Actions

### Task 3: Verify Provider And Utility Skill Rules

**Files:**
- Verify: `.codex/skills/build/SKILL.md`
- Reference: repository `AGENTS.md` instructions supplied in the task context

- [ ] **Step 1: Confirm provider immutability guidance exists**

Run:

```bash
rg -n "packages/provider|provider skills|upstream skills" .codex/skills/build/SKILL.md
```

Expected: the skill blocks release of provider-skill modifications under `packages/provider/`.

- [ ] **Step 2: Confirm utility portability guidance exists**

Run:

```bash
rg -n "tool-agnostic|\\.agents/skills|\\.claude/skills|SKILL_DIR|regression coverage" .codex/skills/build/SKILL.md
```

Expected: the skill requires utility skills to avoid Codex-only paths unless Claude equivalents or a tool-neutral placeholder are documented, and requires regression coverage when tool-specific installed paths or helper examples are introduced.

- [ ] **Step 3: Confirm Codex runner exception is narrow**

Run:

```bash
rg -n "run-codex-install\\.js|fixed to Codex|--tool codex|\\.agents/skills" .codex/skills/build/SKILL.md
```

Expected: `.agents/skills` appears only in the Codex runner smoke test and the utility portability rule, with an explicit note that the runner exception is valid because it is fixed to Codex.

### Task 4: Run Documentation Verification

**Files:**
- Verify: `.codex/skills/build/SKILL.md`

- [ ] **Step 1: Check for markdown whitespace errors**

Run:

```bash
git diff --check -- .codex/skills/build/SKILL.md
```

Expected: no output and exit code `0`.

- [ ] **Step 2: Search for placeholders or ambiguous instructions**

Run:

```bash
rg -n "TBD|TODO|PLACEHOLDER|maybe|should probably|publish manually|npm publish" .codex/skills/build/SKILL.md
```

Expected: no matches. If `npm publish` appears, it must be inside a prohibition; otherwise edit the skill before proceeding.

- [ ] **Step 3: Review the final skill diff**

Run:

```bash
git diff -- .codex/skills/build/SKILL.md
```

Expected: the diff only modifies `.codex/skills/build/SKILL.md`, preserves local tarball commands, adds release-readiness validation, adds the human approval gate, and forbids local publication.

### Task 5: Commit The Skill Update

**Files:**
- Commit: `.codex/skills/build/SKILL.md`

- [ ] **Step 1: Confirm only intended files are staged**

Run:

```bash
git status --short
```

Expected: `.codex/skills/build/SKILL.md` is modified. Pre-existing unrelated changes may still appear, but they must not be staged for this commit.

- [ ] **Step 2: Stage only the build skill**

Run:

```bash
git add .codex/skills/build/SKILL.md
```

Expected: only `.codex/skills/build/SKILL.md` is staged for this commit.

- [ ] **Step 3: Commit the build skill update**

Run:

```bash
git commit --only .codex/skills/build/SKILL.md -m "docs: enhance build skill release readiness"
```

Expected: commit succeeds and includes only `.codex/skills/build/SKILL.md`.

---

## Self-Review

Spec coverage:

- Purpose and scope: Task 1 updates the skill description, modes, outcomes, and preconditions.
- Release boundary: Task 2 verifies alignment with `.github/workflows/release.yml` and release-process docs.
- Human approval gate: Task 1 adds the gate; Task 2 verifies no local publication path is introduced.
- Repository checks and validation gate: Task 1 adds command sequences and failure classifications.
- Skill consistency checks: Task 3 verifies provider immutability and utility portability rules.
- Publish flow: Task 1 adds the approved `develop -> main` git flow.
- Error handling: Task 1 adds blocker categories and stop conditions.
- Testing and verification: Task 4 provides focused documentation validation.

Placeholder scan:

- The plan contains no unresolved placeholders.
- The only allowed future-looking note is that scripts would need test coverage if introduced later; this implementation does not introduce scripts.

Type consistency:

- No code APIs or new types are introduced.
- Command names match existing `package.json` scripts and repository docs.
