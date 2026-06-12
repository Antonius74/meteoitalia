---
name: build
description: Use when asked to build, verify, release-check the next shareable GEN-skills artifact, refresh release notes after a new GEN-skills version is built, or prepare approved GEN-skills enhancements for the develop-to-main GitHub release automation.
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

When a new shareable version is built, also use `$release-notes` to create or refresh `guides/developer-distribution/release-notes-<version>.md` before the final response.

For release readiness, produce:

- a concise validation summary
- the developer distribution release note path and version covered when a new version is created
- the local tarball version and paths
- the release dry-run result
- a clear go/no-go recommendation
- an explicit user approval prompt before any push or merge

## Preconditions

- Run from the repository root. If needed, resolve it with `git rev-parse --show-toplevel`.
- Require Node 20+ and `npm`.
- Resolve those executables before building. If the active Codex shell exposes `node` but not `npm`, use a real Node/npm toolchain by prepending its `bin` directory to `PATH` or by calling the npm executable directly.
- Keep the workspace manifest version unchanged unless the user explicitly asks to edit repository versioning. The shareable build only writes the anticipated version into the staged `package.json` inside the tarball.
- Select the shareable artifact version from the version policy below before building. Do not let an existing local tarball force a higher version; rebuild the selected version instead.
- Use the build script `--version` override only when the selected version is not the default next patch, when the user explicitly asks for a specific shareable artifact version, or when `npm run release:dry-run` predicts a non-matching semantic-release version that must be mirrored by the local artifact.
- Do not edit `package.json`, `package-lock.json`, `CHANGELOG.md`, release tags, or GitHub releases for official versioning. Official release versioning belongs to `semantic-release`, which updates the manifest on `main` during release.

## Shareable Version Policy

Choose the local shareable artifact version from the current `package.json` version before running the build. This does not edit repository version files.

Version precedence:

1. **Major (`X.0.0`):** use a major version only when the user explicitly says the release is major or asks for a specific major version. Never infer a major release from the diff. If the user says the release is major without naming an exact version, use the next major version, such as `2.0.0` after `1.1.1`.
2. **Patch (`x.y.Z`):** if the change modifies previous existing skills, treat those changes as fixes to existing behavior and build the next patch version. For example, package version `1.1.1` builds `gen-skills-1.1.2.tgz`.
3. **Minor (`x.Y.0`):** if the user explicitly confirms that the build is stable, and the scope is not only modifications to previous existing skills, build the next minor version. Stable means the user confirms the build is stable; do not infer stability from passing tests alone. For example, package version `1.1.1` builds `gen-skills-1.2.0.tgz`.
4. **Patch fallback (`x.y.Z`):** if there is no explicit stable confirmation and no explicit major request, build the next patch version.

Documentation-only examples:

- Improvements to repository documentation such as `README.md`, `docs/`, or `guides/` qualify for the minor path only after the user explicitly confirms the build is stable.
- Documentation edits inside previous existing skills still count as modifications to previous existing skills, so they use the patch path unless the user explicitly requests a major release.

Use these commands for the selected version:

```bash
# Patch or patch fallback:
npm run build:codex-shareable

# Minor after explicit user stable confirmation:
npx tsx scripts/build-codex-shareable.ts --version <current-major>.<current-minor-plus-one>.0

# Major only when explicitly requested by the user:
npx tsx scripts/build-codex-shareable.ts --version <selected-major>.0.0
```

If the selected `dist/codex-shareable/gen-skills-<version>.tgz` already exists, the build replaces that tarball. Do not create a higher version just to avoid overwriting a local artifact.

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

## Main Reconciliation Gate

Before release-readiness validation, make `develop` include any release commits that already landed on `origin/main`. Semantic-release commits from a previous publish can advance `main` while `develop` is still being prepared. Those commits must be reconciled into `develop` before validation, otherwise `main` cannot fast-forward later.

Run this reconciliation before the validation gate:

```bash
git fetch origin develop main
git switch develop
git pull --ff-only origin develop
if ! git merge-base --is-ancestor origin/main develop; then
  git merge --no-edit origin/main
fi
```

Rules:

- This merge is allowed only before validation because the merged `develop` tip will be fully validated.
- If the merge conflicts, stop and report a repository-state blocker with the conflicting files. Do not auto-resolve conflicts.
- If `origin/main` advances after validation but before pushing `main`, stop, reconcile `origin/main` into `develop`, rerun the full validation gate, and only then retry publishing.
- Never push a `main` merge result that includes commits not present in the validated `develop` HEAD.

## Validation Gate

Before asking for approval to merge `develop` into `main`, run:

```bash
npm ci
git diff --check
npm audit --audit-level=moderate
npm test
npm run prepare
# Run the selected shareable build command from the Shareable Version Policy.
npm run release:dry-run
```

After `npm run release:dry-run`, compare the predicted `nextRelease.version`, when one is reported, with the local tarball version. If they differ, rebuild the shareable artifact with the predicted version and smoke-test that artifact:

```bash
npx tsx scripts/build-codex-shareable.ts --version <nextRelease.version>
```

Do not proceed to release approval with a local artifact version that differs from the semantic-release dry-run prediction. If dry-run predicts no release, keep the local artifact as build evidence only and do not describe its version as the next official package version.

## Release Notes Handoff

Use `$release-notes` after the build has produced a concrete new version and before the final build or release-readiness summary.

Trigger the handoff when any of these are true:

- `npm run build:codex-shareable` writes `dist/codex-shareable/gen-skills-<version>.tgz` for the next shareable version.
- `npx tsx scripts/build-codex-shareable.ts --version <version>` writes or rewrites the final artifact version that should be handed to developers.
- Release evidence shows that `semantic-release` has created a new package version in `CHANGELOG.md`, tags, or package release artifacts.

Handoff rules:

- Run `$release-notes` against the current repository evidence so it creates or refreshes `guides/developer-distribution/release-notes-<version>.md`.
- If the only evidence is a local shareable tarball, the release note must label it as a local shareable developer artifact instead of an official package publication.
- If `npm run release:dry-run` only predicts a version and no artifact, changelog entry, tag, or package version was created, do not write an official release note unless the user explicitly asks for a draft.
- If the semantic-release dry-run prediction forces an artifact rebuild with a different version, run `$release-notes` only after the final rebuilt artifact exists.
- Include the release-note path and version covered in the final response whenever this handoff runs. If the handoff cannot complete, stop and report the blocker before claiming the build is complete.

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
git diff --name-only origin/main...HEAD -- packages/provider/
rg -n "\\.agents/skills|\\.claude/skills|SKILL_DIR" packages/utility .codex/skills docs guides README.md
```

Rules:

- Do not release changes that modify provider skills under `packages/provider/`; they are upstream skills and should stay consistent through provider package updates.
- Utility skills must stay tool-agnostic by default.
- Utility guidance, scripts, and examples must not hardcode Codex-only installed paths such as `.agents/skills` unless they also document equivalent Claude paths such as `.claude/skills` or use a tool-neutral placeholder such as `SKILL_DIR`.
- Add or confirm regression coverage when utility skills include tool-specific install paths or helper-script examples.

The generated Codex runner smoke test may check `.agents/skills/...` because `run-codex-install.js` is explicitly fixed to Codex and always passes `--tool codex`.

## Build Local Shareable Artifact

Build the selected shareable artifact version without editing repository version files. Use the Shareable Version Policy to choose patch, minor, or explicit user-requested major before running the command.

For patch releases and the patch fallback, build the next anticipated package patch version:

```bash
npm run build:codex-shareable
```

Equivalent direct command:

```bash
npx tsx scripts/build-codex-shareable.ts --next-version
```

For minor releases after explicit user stable confirmation, compute the next minor version from the current `package.json` version and use an explicit shareable version override:

```bash
npx tsx scripts/build-codex-shareable.ts --version 1.2.0
```

Use an explicit major version override only when the user requested a major release:

```bash
npx tsx scripts/build-codex-shareable.ts --version 2.0.0
```

This writes the share bundle to:

- `dist/codex-shareable/gen-skills-<version>.tgz`
- `dist/codex-shareable/run-codex-install.js`

If `dist/codex-shareable/gen-skills-<version>.tgz` already exists for the selected version, the build replaces that tarball. Do not create a higher local-only version just to avoid overwriting a local artifact.

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
- release note path and version covered, when a new version was created
- local tarball version and paths
- release dry-run result
- target branch flow: `develop -> main`
- reminder that GitHub Actions publishes from `main`

Ask the user directly whether to proceed. Do not push, merge, tag, or otherwise activate release automation without explicit approval.

## Publish Flow After Approval

After explicit user approval, perform only the git branch flow needed to activate GitHub automation.

First capture and report the validated commit before switching branches:

```bash
git status --short --branch
release_head=$(git rev-parse HEAD)
printf 'Validated release HEAD: %s\n' "$release_head"
```

Then ensure `develop` contains exactly the commits that were validated before pushing `origin/develop` or merging into `main`. If `develop` has commits that are not ancestors of the validated release head, stop and re-run validation from `develop` or ask the user to approve a wider release scope before continuing.

```bash
git switch develop
git pull --ff-only origin develop
git merge-base --is-ancestor develop "$release_head" || {
  printf '%s\n' "develop contains commits that were not part of the validated release HEAD."
  printf '%s\n' "Stop, re-run validation from develop, or ask the user to approve the wider release scope."
  exit 1
}
git merge-base --is-ancestor "$release_head" develop || git merge --ff-only "$release_head" || {
  printf '%s\n' "Validated release HEAD is not reachable from develop by fast-forward."
  printf '%s\n' "Stop and merge intentionally only after re-running validation on the resulting develop tip."
  exit 1
}
git merge-base --is-ancestor "$release_head" develop
git push origin develop
git fetch origin main
git merge-base --is-ancestor origin/main develop || {
  printf '%s\n' "origin/main contains commits that were not part of the validated develop HEAD."
  printf '%s\n' "Stop, reconcile origin/main into develop, and re-run the full validation gate before publishing."
  exit 1
}
git switch main
git pull --ff-only origin main
git merge --ff-only develop
git push origin main
```

If `develop` does not already contain the validated commit, fast-forward `develop` to the validated release head before pushing. If `develop` cannot fast-forward to the validated release head, or if `main` cannot fast-forward to `develop`, stop; do not create an unvalidated merge commit. If Git reports conflicts, stop and report the conflicting files. Do not auto-resolve conflicts.

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
- the release note path and version covered, when `$release-notes` ran
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
- release note path and version covered, when a new version was created
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
