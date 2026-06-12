# Developer Distribution Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Codex-only distributable developer guide pack for installing and using `@nexidigital/nd-gen-skills`, with local tarball installation as the primary path.

**Architecture:** Add a focused `guides/developer-distribution/` guide pack with `installation/`, `workflow/`, and `documentation/` subfolders. Move the official AIGOV documentation standard PDF into the documentation subfolder, then update existing repository docs so the new pack and moved standard are discoverable without changing CLI behavior or provider skill contents.

**Tech Stack:** Markdown, existing `@nexidigital/nd-gen-skills` CLI command syntax, Codex managed skill paths, Git documentation verification.

---

## Scope Check

The approved spec is documentation-only and cohesive. It does not require TypeScript source changes, package manifest changes, registry rebuilds, generated tarball refreshes, or edits to provider skills under `packages/provider/`.

The worktree already contains unrelated local edits and staged documentation. Preserve them. Stage and commit only files touched by this plan when executing each task.

## File Structure

Create these files:

```text
guides/developer-distribution/README.md
guides/developer-distribution/installation/README.md
guides/developer-distribution/installation/local-tarball.md
guides/developer-distribution/installation/published-package.md
guides/developer-distribution/workflow/README.md
guides/developer-distribution/workflow/choose-provider-and-variant.md
guides/developer-distribution/workflow/superpowers-tdd.md
guides/developer-distribution/workflow/provider-skills.md
guides/developer-distribution/utility-skills.md
guides/developer-distribution/documentation/README.md
guides/developer-distribution/documentation/document-codebases.md
```

Move the official documentation standard PDF into:

```text
guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf
```

Modify these existing files:

```text
README.md
guides/install/README.md
guides/utilities/documentation-kit.md
guides/utilities/support-utility-skills.md
```

Responsibilities:

- `guides/developer-distribution/README.md`: guide-pack entry point and decision table.
- `installation/README.md`: choose local tarball or published package installation.
- `installation/local-tarball.md`: primary install path for developers who receive a prebuilt `.tgz`.
- `installation/published-package.md`: secondary install path for developers with Nexi Artifactory access.
- `workflow/README.md`: provider/workflow entry point.
- `workflow/choose-provider-and-variant.md`: provider and runtime variant chooser with Superpowers default.
- `workflow/superpowers-tdd.md`: practical Superpowers TDD stream with prompts.
- `workflow/provider-skills.md`: provider-skill model and future-provider extension guidance.
- `utility-skills.md`: generic utility install, remove, validate, and usage patterns.
- `documentation/README.md`: documentation guide entry point and link to the official standard.
- `documentation/document-codebases.md`: documentation-kit usage, scaffolding, `AGENTS.md`, and prompt examples.
- `README.md`: add top-level route to the developer guide pack.
- `guides/install/README.md`: point developers with prebuilt tarballs to the new local tarball guide.
- `guides/utilities/documentation-kit.md`: update moved PDF link and remove stale old-governance-folder wording.
- `guides/utilities/support-utility-skills.md`: update moved PDF link and fix the incomplete MarkItDown remote-input sentence.

---

### Task 1: Preflight And Worktree Boundary

**Files:**
- Read: `docs/superpowers/specs/2026-06-05-developer-distribution-guides-design.md`
- Read: `git status --short`

- [ ] **Step 1: Review the approved spec**

Run:

```bash
sed -n '1,360p' docs/superpowers/specs/2026-06-05-developer-distribution-guides-design.md
```

Expected: the spec describes `guides/developer-distribution/` with `installation/`, `workflow/`, `documentation/`, local tarball as the primary path, Codex-only examples, Superpowers as default, and the AIGOV PDF moved into the documentation folder.

- [ ] **Step 2: Inspect current worktree state**

Run:

```bash
git status --short
git diff --cached --stat
```

Expected: existing unrelated local edits may be present. Do not revert them. Do not broad-stage with `git add -A`.

- [ ] **Step 3: Record old PDF references**

Run:

```bash
rg -n "AIGOV|Documentation Naming" README.md guides docs packages -g '*.md'
```

Expected: at least `guides/utilities/documentation-kit.md` and `guides/utilities/support-utility-skills.md` reference the old PDF path before Task 8 updates them.

---

### Task 2: Create Guide Directories And Move The Standard PDF

**Files:**
- Create directory: `guides/developer-distribution/installation/`
- Create directory: `guides/developer-distribution/workflow/`
- Create directory: `guides/developer-distribution/documentation/`
- Move: official documentation standard PDF from its current repository location
- Create destination: `guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf`

- [ ] **Step 1: Create guide directories**

Run:

```bash
mkdir -p guides/developer-distribution/installation guides/developer-distribution/workflow guides/developer-distribution/documentation
```

Expected: command exits successfully.

- [ ] **Step 2: Move the governance PDF**

Run:

```bash
git mv "$(find docs -name 'AIGOV-Standard_ Documentation Naming and Structure.pdf' -print -quit)" "guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf"
```

Expected: Git records the PDF as moved. If `git mv` fails because the destination already exists, inspect both files with `ls -l` and preserve the existing PDF content only if it is the same file.

- [ ] **Step 3: Confirm the old path is gone and destination exists**

Run:

```bash
test -f "guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf"
```

Expected: the `test` command exits successfully and the PDF exists in the developer distribution documentation folder.

---

### Task 3: Write The Guide Pack Entry Point

**Files:**
- Create: `guides/developer-distribution/README.md`

- [ ] **Step 1: Create `guides/developer-distribution/README.md`**

Write the file with these sections:

```markdown
# Nexi AI Skills Developer Guide

## Start Here

Use this guide pack to install and use `@nexidigital/nd-gen-skills` in Codex repositories.

## Choose Your Install Path

| Situation | Start here |
| --- | --- |
| You received a prebuilt `.tgz` package archive | [Install from a local tarball](installation/local-tarball.md) |
| You have access to Nexi Artifactory and an npm token | [Install from the published package](installation/published-package.md) |

## What To Do Next

| Need | Guide |
| --- | --- |
| Choose the default provider and runtime variant | [Choose provider and variant](workflow/choose-provider-and-variant.md) |
| Use Superpowers for a TDD development stream | [Use Superpowers with TDD](workflow/superpowers-tdd.md) |
| Understand provider skills and future providers | [Provider skills](workflow/provider-skills.md) |
| Document a codebase | [Documentation guide](documentation/README.md) |
| Install one utility skill | [Utility skills](utility-skills.md) |

## Default Recommendation

For normal Codex development, install the default `superpowers` provider with the runtime variant that matches the target repository.

## What The Installer Writes

For Codex, the installer writes managed skills under `.agents/skills`, records ownership in `.agents/nd-gen-skills.lock.yaml`, and updates the managed Nexi block in root `AGENTS.md`.

## Safety Rules

Do not manually edit managed skill files or the managed Nexi block in `AGENTS.md`. Put repository-specific instructions outside the managed block.
```

Expected: the file is Codex-only, routes local tarball first, and links to all guide-pack subfolders.

- [ ] **Step 2: Check guide-pack README links manually**

Run:

```bash
rg -n "\\[[^]]+\\]\\(([^)]+)\\)" guides/developer-distribution/README.md
```

Expected: links point only to files that this plan creates under `guides/developer-distribution/`.

---

### Task 4: Write Installation Guides

**Files:**
- Create: `guides/developer-distribution/installation/README.md`
- Create: `guides/developer-distribution/installation/local-tarball.md`
- Create: `guides/developer-distribution/installation/published-package.md`

- [ ] **Step 1: Create `installation/README.md`**

Write the file with:

```markdown
# Installation

Choose one install path:

| Path | Use when |
| --- | --- |
| [Local tarball](local-tarball.md) | You received a prebuilt `.tgz` package archive in a local or shared folder. |
| [Published package](published-package.md) | You have Nexi Artifactory access and an npm token. |

The local tarball path is the primary path for distributed package testing and developer onboarding when repository source access is not available.

After installation, continue with [Choose provider and variant](../workflow/choose-provider-and-variant.md).
```

Expected: local tarball is presented first.

- [ ] **Step 2: Create `installation/local-tarball.md`**

Write the file with these sections:

```markdown
# Install From A Local Tarball

## Prerequisites

- Node.js 20 or newer.
- npm.
- Codex.
- A target repository where skills should be installed.
- A prebuilt `nexidigital-nd-gen-skills-*.tgz` package archive.

## Set The Tarball Path

```bash
TARBALL="/absolute/path/to/nexidigital-nd-gen-skills-0.1.0.tgz"
printf '%s\n' "$TARBALL"
```

Use an absolute path because commands run from the target repository.

## Install The Default Superpowers Setup

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant frontend-react
```

## Choose Another Variant

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant backend-java
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant mobile-ios
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant mobile-android
```

## Install Workflow Stack When Needed

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Replace An Existing Variant

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant backend-java --replace-variant
```

## Validate And Inspect

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
npm exec --yes --package "$TARBALL" -- nd-gen-skills list
npm exec --yes --package "$TARBALL" -- nd-gen-skills list --available
```

## Common Problems

- Use an absolute `TARBALL` path.
- Run commands from the target repository, not from the folder that stores the tarball.
- Use `--replace-variant` when switching runtime variants.
- Use `--force` only when intentionally overwriting changed managed files.
```

Expected: this file contains no `npm ci`, `npm run prepare`, `npm run pack`, or source-build instructions.

- [ ] **Step 3: Create `installation/published-package.md`**

Write the file with these sections:

```markdown
# Install From The Published Package

## Registry

The package is published to the Nexi Artifactory npm registry:

```text
https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local
```

## Configure npm

```bash
export NPM_TOKEN="<your-artifactory-npm-token>"
npm config set @nexidigital:registry https://artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local --location=user
npm config set //artifactory.nexicloud.it/artifactory/api/npm/libs-nexidigital-local/:_authToken "\${NPM_TOKEN}" --location=user
```

## Verify Access

```bash
npm view @nexidigital/nd-gen-skills version
```

## Install The Default Superpowers Setup

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

## Install Workflow Stack When Needed

```bash
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Validate And Inspect

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
npx -y @nexidigital/nd-gen-skills list
npx -y @nexidigital/nd-gen-skills list --available
```

## Optional Global CLI

```bash
npm install -g @nexidigital/nd-gen-skills
nd-gen-skills install --variant frontend-react
```

Use mirrored registry values only when your team explicitly provides a different registry URL and token source.
```

Expected: the file uses concrete Nexi Artifactory values and Codex-only commands.

---

### Task 5: Write Workflow Guides

**Files:**
- Create: `guides/developer-distribution/workflow/README.md`
- Create: `guides/developer-distribution/workflow/choose-provider-and-variant.md`
- Create: `guides/developer-distribution/workflow/superpowers-tdd.md`
- Create: `guides/developer-distribution/workflow/provider-skills.md`

- [ ] **Step 1: Create `workflow/README.md`**

Write the file with:

```markdown
# Workflow

Provider skills define how Codex plans, implements, verifies, reviews, and documents work after installation.

Use `superpowers` as the default provider for normal development. Use `workflow-stack` only when work needs governed Jira or requirement evidence, structured workflow artifacts, and traceability.

| Need | Guide |
| --- | --- |
| Choose provider and runtime variant | [Choose provider and variant](choose-provider-and-variant.md) |
| Follow a TDD development stream | [Superpowers TDD](superpowers-tdd.md) |
| Understand provider skills and future providers | [Provider skills](provider-skills.md) |
```

- [ ] **Step 2: Create `workflow/choose-provider-and-variant.md`**

Write the file with provider and variant tables plus these command examples:

```markdown
# Choose Provider And Variant

## Provider

| Provider | Default | Use when | Install shape |
| --- | --- | --- | --- |
| `superpowers` | Yes | Normal design, planning, TDD, debugging, review, and verification. | Omit `--provider` or pass `--provider superpowers`. |
| `workflow-stack` | No | Governed Jira or evidence-heavy delivery with traceable artifacts. | Pass `--provider workflow-stack`. |

## Variant

| Variant | Use when |
| --- | --- |
| `frontend-react` | React frontend repositories. |
| `backend-java` | Java backend repositories. |
| `mobile-ios` | iOS repositories. |
| `mobile-android` | Android repositories. |

## Local Tarball Examples

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant frontend-react
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant backend-java
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Published Package Examples

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
npx -y @nexidigital/nd-gen-skills install --variant backend-java
npx -y @nexidigital/nd-gen-skills install --provider workflow-stack --variant frontend-react
```

## Validate

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
npx -y @nexidigital/nd-gen-skills validate --ci
```
```

- [ ] **Step 3: Create `workflow/superpowers-tdd.md`**

Write the file with:

```markdown
# Use Superpowers With TDD

## Development Stream

1. `$brainstorming` turns an idea into an approved design/spec.
2. `$writing-plans` creates an implementation plan.
3. `$test-driven-development` drives red, green, refactor.
4. `$systematic-debugging` investigates failures before fixes.
5. `$requesting-code-review` and `$receiving-code-review` handle review.
6. `$verification-before-completion` verifies before completion claims.

## Prompt Examples

```text
Use $brainstorming to refine this feature idea using the installed runtime variant:
Add a saved beneficiary search filter that remembers the user's last query.
```

```text
Use $writing-plans to create an implementation plan from docs/superpowers/specs/<spec-file>.md.
```

```text
Use $test-driven-development to implement the next task from the plan with red-green-refactor discipline.
```

```text
Use $systematic-debugging to investigate this failing command:
npm test -- tests/example.test.ts
```

```text
Use $verification-before-completion to verify the completed work before final response.
```
```

Expected: prompt examples are copy-pasteable and do not mention Claude.

- [ ] **Step 4: Create `workflow/provider-skills.md`**

Write the file with:

```markdown
# Provider Skills

Provider skills define the workflow phases Codex can use after installation. The selected runtime variant adapts those workflows to the repository type.

| Provider | Role |
| --- | --- |
| `superpowers` | Default provider for design, plans, TDD, debugging, review, and verification. |
| `workflow-stack` | Governed provider for evidence-heavy delivery, workflow state, requirements, architecture, test design, and traceability. |

Future providers should be documented under this `workflow/` folder. Add a provider section with its install command, when to use it, main workflow skills, and expected artifacts.

For default development, continue with [Superpowers TDD](superpowers-tdd.md).
```

---

### Task 6: Write Documentation Guides

**Files:**
- Create: `guides/developer-distribution/documentation/README.md`
- Create: `guides/developer-distribution/documentation/document-codebases.md`
- Existing moved PDF: `guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf`

- [ ] **Step 1: Create `documentation/README.md`**

Write the file with:

```markdown
# Documentation

Use this folder when you need to document a codebase with `documentation-kit` and the official Nexi documentation standard.

| Need | Start here |
| --- | --- |
| Install and use documentation-kit | [Document codebases](document-codebases.md) |
| Read the official standard | [Standard: Documentation Naming and Structure](AIGOV-Standard_%20Documentation%20Naming%20and%20Structure.pdf) |

The standard defines repository-level documentation, local documentation boundaries, workflow naming, ownership, and maintenance rules.
```

- [ ] **Step 2: Create `documentation/document-codebases.md`**

Write the file with these sections and command examples:

```markdown
# Document Codebases With Documentation Kit

## Install documentation-kit

From a local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit
```

From the published package:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

## Repository-Level Scaffold

```text
<repo>/
  README.md
  ARCHITECTURE.md
  docs/
    WORKFLOW.md
    adr/
      adr-001-<name>.md
    workflows/
      workflow-functional-<name>.md
      workflow-technical-<name>.md
```

`README.md` and `ARCHITECTURE.md` are mandatory. `docs/`, `docs/WORKFLOW.md`, ADRs, workflow files, integration docs, testing docs, deployment docs, and release docs are added only when they materially improve implementation, validation, maintenance, operations, or handoff.

## Local Boundary Scaffold

```text
<feature-or-service>/
  README.md
  docs/
    WORKFLOW.md
    functional-requirement-<name>.md
    integration-<name>.md
    workflows/
      workflow-functional-<name>.md
      workflow-technical-<name>.md
```

Create local documentation only for meaningful features, services, capabilities, external integrations, unclear ownership areas, recurring ambiguity, or defect-prone boundaries.

## AGENTS.md

The installer writes a managed Nexi block in root `AGENTS.md`. Do not manually edit that managed block. Add repository-specific instructions outside the block. Codex uses the managed block to discover the installed provider, runtime variant, contracts, and utilities.

## Prompt Examples

```text
Use $documentation-kit in this repository to refresh README.md and ARCHITECTURE.md from the current source tree.
Follow the documentation standard in guides/developer-distribution/documentation.
```

```text
Use $documentation-kit to scaffold repository documentation:
- README.md
- ARCHITECTURE.md
- docs/WORKFLOW.md only if repository-wide workflows exist
Keep deeper docs bounded and link to source-of-truth contracts where relevant.
```

```text
Use $documentation-ubiquitous-language to create docs/UBIQUITOUS_LANGUAGE.md from this repository and the current conversation.
Pick canonical terms, list aliases to avoid, and flag overloaded terms that need product confirmation.
```
```

Expected: the file references the local PDF folder and includes repository-level scaffold, local boundary scaffold, `AGENTS.md`, and prompt examples.

---

### Task 7: Write Utility Skills Guide

**Files:**
- Create: `guides/developer-distribution/utility-skills.md`

- [ ] **Step 1: Create `utility-skills.md`**

Write the file with:

```markdown
# Utility Skills

Utility skills add focused capabilities without changing the active provider or runtime variant.

## List Available Utilities

Local tarball:

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills list --available
```

Published package:

```bash
npx -y @nexidigital/nd-gen-skills list --available
```

## Install A Utility

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills add-skill documentation-kit
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

## Remove A Utility

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills remove-skill documentation-kit
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

## Validate

```bash
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
npx -y @nexidigital/nd-gen-skills validate --ci
```

## Common Utilities

| Utility | Use when |
| --- | --- |
| `documentation-kit` | Create, refresh, or audit repository documentation. |
| `tdd` | Use behavior-focused red-green-refactor guidance. |
| `grill-me` | Challenge and clarify an implementation idea or plan. |
| `markitdown` | Convert local documents to Markdown. |
| `figma-use` | Use Figma Plugin API guidance when the runtime allows Figma work. |
| `frontend-react-e2e-test-implementation` | Generate a Playwright React E2E scenario from selected test cases. |
| `backend-service-implementation-kit` | Implement backend service-layer behavior. |
| `backend-controller-implementation-kit` | Implement backend controller and endpoint layers. |
| `mobile-android-layout-inspector` | Inspect Android layouts with Layout Inspector and ADB capture workflows. |

Some utilities are installed automatically as dependencies and are not directly user-installable.

## Use An Installed Utility

```text
Use $documentation-kit to refresh README.md and ARCHITECTURE.md from the current source tree.
```

```text
Use $grill-me to challenge this implementation idea before I start coding:
<describe the idea>
```
```

Expected: local tarball commands appear before published-package commands where both are shown.

---

### Task 8: Update Existing Repository Documentation

**Files:**
- Modify: `README.md`
- Modify: `guides/install/README.md`
- Modify: `guides/utilities/documentation-kit.md`
- Modify: `guides/utilities/support-utility-skills.md`

- [ ] **Step 1: Update root `README.md` documentation map**

Add a row near the installation rows:

```markdown
| Distribute developer install and usage docs | [Developer guide pack](guides/developer-distribution/README.md) | [Local tarball install](guides/developer-distribution/installation/local-tarball.md) |
```

Add a bullet under installation or guide sections:

```markdown
- [Developer guide pack](guides/developer-distribution/README.md): Codex-only distributable guides for local tarball install, Artifactory install, Superpowers workflow, documentation-kit, and utility skills.
```

Expected: the root README exposes the new guide pack without replacing existing maintainer-oriented docs.

- [ ] **Step 2: Update `guides/install/README.md`**

Add a sentence in the detailed guide list or local tarball section:

```markdown
If you are a developer who received a prebuilt tarball and do not have this repository source, use [Developer local tarball install](../developer-distribution/installation/local-tarball.md).
```

Expected: existing installer guide remains general, and developers are routed to the distribution guide.

- [ ] **Step 3: Update `guides/utilities/documentation-kit.md` PDF link**

Replace:

```markdown
[Standard: Documentation Naming and Structure - AI Engineering Governance - Confluence](<old governance-folder PDF link>)
```

with:

```markdown
[Standard: Documentation Naming and Structure - AI Engineering Governance - Confluence](../developer-distribution/documentation/AIGOV-Standard_%20Documentation%20Naming%20and%20Structure.pdf)
```

Replace the prompt wording:

```text
follow the governance standard in the old governance folder.
```

with:

```text
follow the governance standard in guides/developer-distribution/documentation.
```

Expected: no reference to the old governance folder remains in this file.

- [ ] **Step 4: Update `guides/utilities/support-utility-skills.md` PDF link and sentence defect**

Replace the old PDF link with:

```markdown
[Standard: Documentation Naming and Structure - AI Engineering Governance - Confluence](../developer-distribution/documentation/AIGOV-Standard_%20Documentation%20Naming%20and%20Structure.pdf)
```

Replace the incomplete MarkItDown text:

```markdown
This utility follows Microsoft MarkItDown's official README and defaults to local file conversion. Remote inputs,
YouTube links, and archives require explicit user approval.
```

with:

```markdown
This utility follows Microsoft MarkItDown's official README and defaults to local file conversion. Remote inputs, YouTube links, and archives require explicit user approval.
```

Expected: the incomplete sentence is repaired and the PDF link points to the moved standard.

---

### Task 9: Verify Documentation Links And Command Scope

**Files:**
- Verify: `guides/developer-distribution/**/*.md`
- Verify: `README.md`
- Verify: `guides/install/README.md`
- Verify: `guides/utilities/documentation-kit.md`
- Verify: `guides/utilities/support-utility-skills.md`

- [ ] **Step 1: Check for stale governance path**

Run:

```bash
rg -n "AIGOV-Standard|old governance folder" README.md guides docs packages -g '*.md'
```

Expected: `AIGOV-Standard` references point to `guides/developer-distribution/documentation/...` or to the same-folder PDF from inside `guides/developer-distribution/documentation/`. No stale old-governance-folder reference remains outside this implementation plan's own instructions.

- [ ] **Step 2: Check local tarball guide has no build commands**

Run:

```bash
rg -n "npm ci|npm run prepare|npm run pack|npm pack|build the tarball|build from source" guides/developer-distribution/installation/local-tarball.md
```

Expected: no matches.

- [ ] **Step 3: Check guide pack is Codex-only**

Run:

```bash
rg -n "Claude|--tool claude|\\.claude" guides/developer-distribution
```

Expected: no matches.

- [ ] **Step 4: Check command syntax**

Run:

```bash
rg -n "nd-gen-skills (install|sync|add-skill|remove-skill|list|validate)" guides/developer-distribution README.md guides/install/README.md guides/utilities/documentation-kit.md guides/utilities/support-utility-skills.md
```

Expected: commands use supported CLI verbs and flags from `src/cli/args.ts`: `install`, `sync`, `add-skill`, `remove-skill`, `list`, `validate`, `--variant`, `--provider`, `--replace-variant`, `--force`, `--ci`, and `--available`.

- [ ] **Step 5: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no whitespace errors.

- [ ] **Step 6: Manual relative-link review**

Run:

```bash
find guides/developer-distribution -name '*.md' -print
```

Expected: every linked Markdown file exists in the guide pack. Verify these specific paths exist:

```bash
test -f guides/developer-distribution/installation/local-tarball.md
test -f guides/developer-distribution/installation/published-package.md
test -f guides/developer-distribution/workflow/choose-provider-and-variant.md
test -f guides/developer-distribution/workflow/superpowers-tdd.md
test -f guides/developer-distribution/workflow/provider-skills.md
test -f guides/developer-distribution/documentation/document-codebases.md
test -f "guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf"
```

Expected: all tests pass.

---

### Task 10: Commit Documentation Guide Pack

**Files:**
- Stage only files created, moved, or modified by this plan.

- [ ] **Step 1: Review final status**

Run:

```bash
git status --short
git diff --stat
git diff --cached --stat
```

Expected: unrelated existing local edits are identifiable. Do not stage unrelated tarball changes or unrelated docs unless they are part of this plan.

- [ ] **Step 2: Stage plan-scoped files explicitly**

Run:

```bash
git add README.md \
  guides/install/README.md \
  guides/utilities/documentation-kit.md \
  guides/utilities/support-utility-skills.md \
  guides/developer-distribution/README.md \
  guides/developer-distribution/installation/README.md \
  guides/developer-distribution/installation/local-tarball.md \
  guides/developer-distribution/installation/published-package.md \
  guides/developer-distribution/workflow/README.md \
  guides/developer-distribution/workflow/choose-provider-and-variant.md \
  guides/developer-distribution/workflow/superpowers-tdd.md \
  guides/developer-distribution/workflow/provider-skills.md \
  guides/developer-distribution/utility-skills.md \
  guides/developer-distribution/documentation/README.md \
  guides/developer-distribution/documentation/document-codebases.md \
  "guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf"
```

Expected: only plan-scoped files are staged. If `git add` reports the old PDF path does not exist, run `git status --short` and confirm Git already tracks the deletion from `git mv`.

- [ ] **Step 3: Review staged patch**

Run:

```bash
git diff --cached --stat
git diff --cached -- README.md guides/install/README.md guides/utilities/documentation-kit.md guides/utilities/support-utility-skills.md guides/developer-distribution
```

Expected: staged changes implement the guide pack, moved PDF, existing-doc discoverability, and link fixes. No generated tarballs are staged.

- [ ] **Step 4: Commit**

Run:

```bash
git commit -m "docs: add developer distribution guides"
```

Expected: commit succeeds.
