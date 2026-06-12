---
name: release-notes
description: Create or refresh self-contained, reader-friendly, version-named GEN-skills release notes under guides/developer-distribution after a build, release dry-run, semantic-release version, or shareable artifact version is created. Use when asked for GEN-skills release notes, latest skill additions, release improvements, developer-distribution notes, or when the build skill creates a new version.
---

# Release Notes

## Overview

Use this skill only inside the `GEN-skills` repository. It turns recent release evidence into a self-contained, version-named release note under `guides/developer-distribution/` that a developer or evaluator can read without opening other documents.

## Evidence To Inspect

Start from the repository root and inspect release evidence before writing:

```bash
git rev-parse --show-toplevel
git status --short
git log --oneline --decorate --max-count=20
sed -n '1,180p' CHANGELOG.md
find dist/codex-shareable -maxdepth 1 -name 'gen-skills-*.tgz' -print 2>/dev/null | sort
find packages -maxdepth 3 -name manifest.yaml -print | sort
```

Use more targeted reads as needed:

```bash
git show --stat --oneline <previous-version-tag>..<current-version-tag>
git show --name-only --oneline <previous-version-tag>..<current-version-tag>
git diff --name-only origin/main...HEAD
rg -n "kind: utility|name:|description:|requiresUtilities" packages/utility packages/variant packages/contract .codex/skills guides docs
```

Prefer `CHANGELOG.md` and tags for official semantic-release versions. Prefer `dist/codex-shareable/gen-skills-<version>.tgz` only for local shareable artifact builds that have not produced an official semantic-release version.

## Version Selection

Use the newest version that was actually created:

- If `CHANGELOG.md` has a newest released version, use that as the primary release note version.
- If the build skill just produced a local shareable tarball and no official release exists yet, use the tarball version and label it as a local shareable developer artifact.
- If `npm run release:dry-run` only predicts a version and no package or changelog version was created, write a draft readiness note only when the user explicitly asks for a draft.
- Do not edit `package.json`, `package-lock.json`, `CHANGELOG.md`, tags, or GitHub releases.

## What To Include

Write for developers installing or evaluating the distribution. Keep it factual, evidence-based, and friendly to readers who are not already familiar with the repository internals.

Include:

- release or artifact version;
- release date when known;
- newly added skills, grouped by bundle or domain;
- skill improvements and provider/runtime workflow changes;
- installer, validation, registry, documentation, or publication improvements;
- install commands when a new user-facing skill is added;
- validation coverage added or confirmed;
- short plain-language context for why the release matters to someone installing or using GEN-skills.

Avoid:

- internal commit noise that does not change developer behavior;
- unexplained repository jargon, terse changelog fragments, or maintainer-only wording;
- unsupported future promises;
- claiming publication succeeded from a local build;
- links to other documents, including related-guide sections, relative Markdown links, and "see also" lists;
- provider skill edits under `packages/provider/` as normal local changes.

## File Updates

Write or update a versioned file whose name includes the release or artifact version:

```text
guides/developer-distribution/release-notes-<version>.md
```

Examples:

- Official semantic-release version `1.3.0`: `guides/developer-distribution/release-notes-1.3.0.md`
- Local shareable artifact `1.2.2`: `guides/developer-distribution/release-notes-1.2.2.md`

Do not write the primary release note to the generic `guides/developer-distribution/release-notes.md` path. If a generic file already exists from an older workflow, leave it alone unless the user explicitly asks to migrate or delete it.

Use short headings, concise paragraphs, and Markdown tables for skill lists. The release note must be understandable on its own and must not require links to other guides or documents.

## Consistency Rules

- Keep reusable skill guidance tool-agnostic when documenting installed utility skills.
- If mentioning installed skill locations, map both Codex and Claude paths or use `SKILL_DIR`.
- Do not edit provider skills under `packages/provider/`.
- Do not stage, commit, tag, push, or publish unless the user explicitly asks for that VCS action.
- If release-note evidence conflicts, report the conflict and use the most conservative statement.

## Verification

After editing, run:

```bash
git diff --check
git diff --no-index --check /dev/null guides/developer-distribution/release-notes-<version>.md
```

For an existing tracked release note, the first command is enough. For a newly created untracked release note, use the second command with the actual versioned filename to check the new file.

If this skill itself was edited, also run the skill validator:

```bash
uv run --with pyyaml python /Users/marcofasanella/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/release-notes
```

Report the release-note file path, the version covered, and the verification commands run.
