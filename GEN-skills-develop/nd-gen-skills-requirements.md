# ND Gen Skills Requirements

Date: 2026-05-13

## 1. Purpose

`nd-gen-skills` is a Node-based package installer for distributing enterprise AI skills across repositories.

The first goal is to standardize how Nexi Digital repositories install and use AI workflow skills while keeping the architecture independent from any single AI tool. The installer must support multiple repository variants, use an open-source workflow provider such as Superpowers as the base workflow, and glue that provider to Nexi-specific runtime skills, test-design rules, and workflow contracts.

The installer must be usable locally first through:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

V1 is distributed as an npm package published to the Nexi Artifactory npm registry. The package still contains a bundled local skill registry. V2 can move skill package resolution itself to JFrog Artifactory.

## 2. Core Principles

- The installer is AI-tool agnostic.
- The default tool is `codex`.
- For Codex, V1 installs into repo-local `.agents/skills/`.
- For Claude, V1 installs into repo-local `.claude/skills/`.
- Provider skills are copied unchanged from the approved provider package.
- Superpowers is the default provider for V1.
- Superpowers provider skills keep their exact upstream folder names so skill loading and provider-internal references continue to work.
- Nexi runtime, contract, and utility skills use explicit Nexi names.
- Users do not specify package versions in V1. The installer always resolves the latest bundled approved version.
- The lockfile records the exact installed versions and managed file hashes.
- The installer never overwrites unmanaged local skills.
- One active variant is supported per repo/tool installation in V1.
- Each selected variant installs one visible Nexi runtime skill.
- The runtime skill owns the glue between provider skills, Nexi contracts, test design, TDD usage, and variant-specific guidance.
- `AGENTS.md` should point agents to the installed runtime skill, but detailed workflow behavior lives inside the runtime skill itself.

## 3. V1 Scope

V1 includes:

- npm package: `@nexidigital/nd-gen-skills`
- `npx` usage
- automated semantic-release publishing to the Nexi Artifactory npm registry
- TypeScript implementation
- YAML package manifests with TypeScript schema validation
- bundled local registry inside the npm package
- optional `--registry` override for testing local registries
- Codex adapter targeting `.agents/skills/`
- Claude adapter targeting `.claude/skills/`
- root `AGENTS.md` managed block
- repo-local lockfile:
  - `.agents/nd-gen-skills.lock.yaml` for Codex
  - `.claude/nd-gen-skills.lock.yaml` for Claude
- latest-only package resolution
- one fixed provider workflow subset installed for every variant
- one runtime skill per variant
- shared `nexi-workflow-contracts` package
- utility skill installation and removal
- install, sync, add-skill, remove-skill, list, and validate commands
- managed-file hash checks
- interactive warnings for locally modified managed files
- `--force` for non-interactive overwrite behavior

V1 initial variants:

- `frontend-react`
- `backend-java`
- `mobile-ios`
- `mobile-android`

V1 can include all four variants in the bundled registry, even if some runtime guidance starts smaller than others. Each variant must still install a valid runtime skill.

## 4. Out Of Scope For V1

V1 does not include:

- JFrog Artifactory skill registry backend
- remote registry service
- provider import automation
- package approval lifecycle commands
- user-selected package versions
- variant profiles
- monorepo or multi-workspace variants
- nested `AGENTS.md` management
- workflow execution runtime
- machine enforcement of provider/support artifact pipelines
- installer-created workflow artifact folders
- `.gitignore` modification
- provider skill rewriting
- automatic migration from `.codex` folders

## 5. V2 And Future Scope

Future versions may add:

- JFrog Artifactory as the default skill registry backend
- registry client implementations for Artifactory metadata and artifacts
- provider import automation, for example importing latest Superpowers into the internal registry
- approval channels such as stable, candidate, canary, and deprecated
- variant profiles, for example:

```bash
npx -y @nexidigital/nd-gen-skills install \
  --variant frontend-react \
  --profile nextjs-app-router
```

- monorepo support with multiple scoped variants
- nested `AGENTS.md` files per workspace
- workflow artifact validation commands
- richer schema validation for generated contract artifacts
- optional integration with Jira, Confluence, or test management systems

## 6. CLI Requirements

The package name is:

```text
@nexidigital/nd-gen-skills
```

Primary usage:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

The CLI should expose a `bin` entry so `npx` can run the package directly.

The default tool is `codex`.

Equivalent explicit command:

```bash
npx -y @nexidigital/nd-gen-skills install \
  --tool codex \
  --variant frontend-react
```

Supported V1 tools:

- `codex`
- `claude`

Unsupported tools must fail with a clear error.

### 6.1 Registry Resolution

Registry lookup order:

1. `--registry` flag
2. `NEXI_AI_SKILLS_REGISTRY` environment variable
3. bundled registry inside the npm package

V1 default is bundled/local. The registry override exists to test custom local registries without publishing a new CLI package.

### 6.2 Commands

Install workflow distribution:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

Install for Claude:

```bash
npx -y @nexidigital/nd-gen-skills install \
  --tool claude \
  --variant frontend-react
```

Replace existing variant:

```bash
npx -y @nexidigital/nd-gen-skills install \
  --variant backend-java \
  --replace-variant
```

Sync all managed packages to latest bundled approved versions:

```bash
npx -y @nexidigital/nd-gen-skills sync
```

Overwrite changed managed files without prompting:

```bash
npx -y @nexidigital/nd-gen-skills sync --force
```

Add utility skill:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

Remove utility skill:

```bash
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

List local install:

```bash
npx -y @nexidigital/nd-gen-skills list
```

List available registry packages:

```bash
npx -y @nexidigital/nd-gen-skills list --available
```

Validate installed state:

```bash
npx -y @nexidigital/nd-gen-skills validate
```

Validate in CI:

```bash
npx -y @nexidigital/nd-gen-skills validate --ci
```

## 7. Package Kinds

V1 supports these package kinds:

### 7.1 Provider

The provider package supplies the base workflow skills.

V1 provider:

```text
superpowers
```

The provider package defines the fixed workflow subset installed for every variant. The installer must not hardcode provider skill names.

Provider skills are copied unchanged.

Provider skills keep upstream names:

```text
brainstorming
writing-plans
executing-plans
test-driven-development
systematic-debugging
verification-before-completion
requesting-code-review
receiving-code-review
finishing-a-development-branch
```

The exact subset is declared by the provider manifest.

### 7.2 Variant Runtime

A variant package installs exactly one visible Nexi runtime skill.

Examples:

```text
nexi-frontend-react-runtime
nexi-backend-java-runtime
nexi-mobile-ios-runtime
nexi-mobile-android-runtime
```

The runtime skill is the main entry point for repository work. It glues together:

- provider workflow skills
- shared Nexi workflow contracts
- test design
- TDD usage
- command discovery
- variant-specific testing tool guidance
- manual test guidance
- final delivery output requirements

The runtime package may contain local `guidance/` and `templates/` files, but only one runtime skill is visible to the AI tool.

### 7.3 Contracts

The shared base package is:

```text
nexi-workflow-contracts
```

It contains:

- shared output templates
- shared test-design rules
- manual test structure
- traceability expectations
- final delivery contract guidance

Variant runtimes can layer variant-specific guidance on top of `nexi-workflow-contracts` at workflow time. The installer must not pre-merge or append templates during installation.

### 7.4 Utility Skills

Utility skills are optional standalone skills by default.

Example:

```text
documentation-kit
```

They are installed only when explicitly requested through `add-skill`.

Utility skills can be installed independently, even if no provider or variant runtime has been installed yet.

Utility manifests may set `userInstallable: false` for internal utility skills
that are used only by providers, variants, or other utilities. Internal
utilities remain installable through dependency resolution, but they are hidden
from `list --available` and cannot be added or removed directly with
`add-skill` or `remove-skill`.

Utility skills are installed into the same tool skill folder as provider, runtime, and contract skills. Their role is recorded in the lockfile.

`add-skill` and `remove-skill` update the managed `AGENTS.md` block so utility skills are discoverable.

## 8. Runtime Workflow Requirements

The runtime skill must be the entry point for implementation, debugging, testing, review, and maintenance work in a repository.

`AGENTS.md` should instruct agents to start with the runtime skill for those work types.

The runtime skill should not be mandatory for simple read-only questions unless the question becomes implementation, debugging, testing, review, or maintenance work.

### 8.1 Runtime Skill Flow

A runtime skill should instruct the agent to:

1. Load/use `nexi-workflow-contracts` at the beginning.
2. Inspect repository documentation to discover build, run, and test commands.
3. Use provider `brainstorming` for behavior-changing or creative work.
4. Preserve provider-native artifact locations and conventions.
5. Create Nexi contract artifacts according to the runtime and contract skill guidance.
6. Produce a structured test design before TDD starts.
7. Use provider `test-driven-development` for automated tests.
8. Apply variant-specific testing guidance for tools such as Playwright, emulators, XCTest, Espresso, API contract tests, or integration tests.
9. Use provider `verification-before-completion` before claiming completion.
10. Produce final traceability output mapping requirements to automated tests, e2e tests, manual tests, and verification evidence.

### 8.2 Provider Skills Stay Untouched

Provider skills may create provider-native outputs in provider-defined locations. The runtime must not force provider skills into a common Nexi folder.

Instead, the runtime links provider outputs to Nexi artifacts in traceability.

Example:

```md
| Artifact | Location | Source |
|---|---|---|
| Superpowers design doc | docs/superpowers/specs/2026-05-13-checkout-design.md | brainstorming |
| Nexi test matrix | vendor runtime defined location | nexi-workflow-contracts |
```

Workflow artifact folders are owned by vendor runtime skill content. The installer must not create or hardcode these folders.

## 9. TDD And Test-Design Requirements

The runtime must preserve the discipline of the Superpowers provider while adding Nexi-specific enterprise test strategy.

Superpowers owns the generic workflow discipline:

- requirements/design before implementation
- TDD red/green/refactor discipline
- fresh verification evidence before completion claims

Nexi runtime and contracts own enterprise specificity:

- command discovery
- test matrix format
- automation coverage expectations
- e2e applicability decision
- manual tester scenario output
- traceability table
- variant-specific testing tool guidance

### 9.1 Test Design Before TDD

The runtime must make test design mandatory before automated TDD implementation starts.

The test design artifact must include:

- requirement IDs
- automated tests
- e2e tests
- manual tests for tester assessment
- traceability from requirements to tests
- e2e applicability status and rationale

### 9.2 Automated Tests

Automated tests must include levels such as:

- unit
- integration
- e2e

The runtime must require red/green discipline for automated behavior coverage where the environment allows it.

For e2e, red/green means:

1. Write the e2e scenario/assertion first.
2. Run it against the current application.
3. Confirm it fails for the expected missing behavior.
4. Implement the behavior.
5. Rerun until the e2e test passes.

If e2e execution is blocked by environment limits, the agent must record:

- blocker
- fallback manual coverage
- residual risk

### 9.3 Manual Tests

Manual tests are first-class output for testers.

Manual tests must include:

- requirement IDs
- persona or actor, when relevant
- scenario
- steps
- expected result
- priority
- notes or data requirements

### 9.4 Traceability

Final workflow output must include traceability from requirements to tests and verification evidence.

Example:

```md
| Requirement | Unit/Integration | E2E | Manual Test | Evidence |
|---|---|---|---|---|
| REQ-001 Enter discount code | AUTO-001 | E2E-001 | MAN-001 | pnpm test, pnpm test:e2e |
| REQ-002 Expired code error | AUTO-002 | E2E-002 | MAN-002 | pnpm test, pnpm test:e2e |
```

Manual-only coverage requires a rationale.

Skipped verification requires blocker and residual risk.

## 10. Command Discovery

Runtime skills must not assume canonical build/run/test commands.

Repository documentation is the source of truth for how to build, run, and test a specific repo.

The runtime must instruct agents to inspect relevant sources before choosing commands, such as:

- README files
- package scripts
- Gradle/Maven files
- Xcode project docs
- Android project docs
- repo-specific testing docs
- CI configuration

The runtime should produce a command-discovery artifact before TDD and verification.

Example:

```md
# Repo Command Discovery

Sources inspected:
- README.md
- package.json
- docs/testing.md

Discovered commands:
- install: pnpm install
- unit tests: pnpm test
- e2e tests: pnpm test:e2e
- build: pnpm build

Testing tools detected:
- Vitest
- Playwright

Notes:
- Playwright requires browser installation before first run.
```

The exact artifact location is owned by the runtime skill, not the installer.

## 11. Tool Adapter Requirements

### 11.1 Codex Adapter

For `tool=codex`:

```text
skills: .agents/skills/<skill-name>/
lockfile: .agents/nd-gen-skills.lock.yaml
```

The Codex adapter ignores `.codex` in V1.

### 11.2 Claude Adapter

For `tool=claude`:

```text
skills: .claude/skills/<skill-name>/
lockfile: .claude/nd-gen-skills.lock.yaml
```

V1 does not support Claude slash commands or agents separately.

### 11.3 Installed Skill Layout

Codex example:

```text
.agents/
  skills/
    brainstorming/
      SKILL.md
    writing-plans/
      SKILL.md
    test-driven-development/
      SKILL.md
    verification-before-completion/
      SKILL.md
    nexi-workflow-contracts/
      SKILL.md
      templates/
      guidance/
    nexi-frontend-react-runtime/
      SKILL.md
      guidance/
      templates/
    read-jira-issue/
      SKILL.md
  nd-gen-skills.lock.yaml
```

## 12. AGENTS.md Requirements

The installer manages a marked block in root `AGENTS.md`.

Markers:

```md
<!-- nd-gen-skills:start -->
...
<!-- nd-gen-skills:end -->
```

The installer must preserve all content outside the managed block.

V1 manages only root `AGENTS.md`.

Example block:

```md
<!-- nd-gen-skills:start -->
## Nexi AI Skills

For implementation, debugging, testing, review, and maintenance work in this repository, start with `nexi-frontend-react-runtime`.

This repository uses Nexi AI Skills installed for the `frontend-react` variant.

Installed utility skills:
- `read-jira-issue`: Read Jira issue evidence for workflow skills in read-only mode.
<!-- nd-gen-skills:end -->
```

The managed block should not mention workflow artifact folders. Artifact conventions are owned by runtime skill content.

## 13. Lockfile Requirements

Lockfile name:

```text
nd-gen-skills.lock.yaml
```

Codex path:

```text
.agents/nd-gen-skills.lock.yaml
```

Claude path:

```text
.claude/nd-gen-skills.lock.yaml
```

The lockfile must record:

- schema version
- tool
- package manager version
- selected provider name and resolved version
- selected variant name and resolved version
- runtime skill name
- installed contracts and resolved versions
- installed utility skills and resolved versions
- managed skills
- managed files and SHA-256 hashes

Example:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
tool: codex
generatedBy: "@nexidigital/nd-gen-skills@0.1.0"

provider:
  name: superpowers
  version: 0.1.0

variant:
  name: frontend-react
  version: 0.1.0
  runtimeSkill: nexi-frontend-react-runtime

contracts:
  - name: nexi-workflow-contracts
    version: 0.1.0

utilities:
  - name: read-jira-issue
    version: 0.1.0

managedSkills:
  - name: brainstorming
    role: provider
    package: provider/superpowers
  - name: nexi-workflow-contracts
    role: contract
    package: contract/nexi-workflow-contracts
  - name: nexi-frontend-react-runtime
    role: runtime
    package: variant/frontend-react

managedFiles:
  - path: .agents/skills/brainstorming/SKILL.md
    package: provider/superpowers
    sha256: "..."
  - path: .agents/skills/nexi-frontend-react-runtime/SKILL.md
    package: variant/frontend-react
    sha256: "..."
```

## 14. File Ownership And Safety

The installer may only mutate files it owns.

Owned files are:

- target skill files listed in the lockfile
- lockfile
- managed `AGENTS.md` block

Rules:

- If a target skill folder exists and is not lockfile-managed, fail.
- If a managed file hash matches the lockfile, it may be updated or removed.
- If a managed file hash differs, warn interactively before overwrite.
- In CI/non-interactive mode, fail on changed managed files unless `--force` is passed.
- Obsolete managed files should be removed during sync after hash checks.
- Empty managed folders may be removed if they contain no unmanaged files.
- Folders containing unmanaged files must be preserved and reported.

Example warning:

```text
Managed skill file changed locally:
  .agents/skills/nexi-frontend-react-runtime/SKILL.md

This file is managed by @nexidigital/nd-gen-skills and will be overwritten by sync.
Save your changes elsewhere before continuing.

Continue and overwrite? [y/N]
```

## 15. Install And Sync Behavior

### 15.1 Install

`install` requires `--variant`.

Bare install must fail with guidance:

```bash
npx -y @nexidigital/nd-gen-skills install
```

Expected error:

```text
Missing required --variant.
Example: npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

Install resolves latest bundled approved versions for:

- default provider
- selected variant
- required base contracts

Install is idempotent.

If the same variant is already installed, `install` behaves like `sync`.

If a different variant is already installed, install fails unless `--replace-variant` is passed.

### 15.2 Sync

`sync` updates all installed managed packages to latest available versions from the configured registry:

- provider
- variant
- contracts
- utility skills

Because user-facing version selection does not exist in V1, `sync` updates everything.

### 15.3 Replace Variant

`--replace-variant` replaces:

- old variant runtime files
- variant-owned managed files
- managed `AGENTS.md` runtime reference
- compatible contracts as resolved by current policy

It preserves:

- utility skills
- unrelated local skills
- user-authored `AGENTS.md` content outside managed block

## 16. Registry And Package Archive Requirements

V1 uses a bundled registry generated during package build.

The registry source lives in the implementation repo. Build scripts generate archive artifacts.

Do not manually maintain package archives.

### 16.1 Registry Index

Use one flat `index.yaml` for V1.

Example:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1

defaults:
  provider: superpowers
  contracts:
    - nexi-workflow-contracts

packages:
  provider/superpowers:
    latest: 0.1.0
    artifact: packages/provider-superpowers-0.1.0.tgz

  contract/nexi-workflow-contracts:
    latest: 0.1.0
    artifact: packages/contract-nexi-workflow-contracts-0.1.0.tgz

  variant/frontend-react:
    latest: 0.1.0
    artifact: packages/variant-frontend-react-0.1.0.tgz

  utility/read-jira-issue:
    latest: 0.1.0
    artifact: packages/utility-read-jira-issue-0.1.0.tgz
    userInstallable: false
```

For V1, `latest` implicitly means approved because only approved packages are included in the bundled index.

### 16.2 Archive Structure

Each package archive contains:

```text
manifest.yaml
...
```

Provider package example:

```text
manifest.yaml
skills/
  brainstorming/
    SKILL.md
  writing-plans/
    SKILL.md
  test-driven-development/
    SKILL.md
```

Variant package example:

```text
manifest.yaml
runtime/
  SKILL.md
  guidance/
  templates/
```

Contract package example:

```text
manifest.yaml
skill/
  SKILL.md
  templates/
  guidance/
```

Utility package example:

```text
manifest.yaml
skill/
  SKILL.md
```

## 17. Manifest Requirements

All package manifests are YAML and validated by TypeScript schemas.

Manifest `apiVersion`:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
```

### 17.1 Provider Manifest

Example:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: provider
name: superpowers
version: 0.1.0

capabilities:
  requirements-design:
    skill: brainstorming
  planning:
    skill: writing-plans
  execution:
    skill: executing-plans
  tdd:
    skill: test-driven-development
  debugging:
    skill: systematic-debugging
  verification:
    skill: verification-before-completion
  code-review:
    skills:
      - requesting-code-review
      - receiving-code-review
  finishing:
    skill: finishing-a-development-branch

skills:
  - name: brainstorming
    role: workflow
    source: skills/brainstorming
  - name: writing-plans
    role: workflow
    source: skills/writing-plans
  - name: executing-plans
    role: workflow
    source: skills/executing-plans
  - name: test-driven-development
    role: workflow
    source: skills/test-driven-development
  - name: systematic-debugging
    role: workflow
    source: skills/systematic-debugging
  - name: verification-before-completion
    role: workflow
    source: skills/verification-before-completion
```

### 17.2 Variant Manifest

Example:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: variant
name: frontend-react
version: 0.1.0

requiresProviderCapabilities:
  - requirements-design
  - planning
  - tdd
  - verification

requiresContracts:
  - nexi-workflow-contracts

runtime:
  skillName: nexi-frontend-react-runtime
  source: runtime
  references:
    - nexi-workflow-contracts
    - brainstorming
    - writing-plans
    - test-driven-development
    - verification-before-completion
```

### 17.3 Contract Manifest

Example:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: contract
name: nexi-workflow-contracts
version: 0.1.0

skill:
  name: nexi-workflow-contracts
  source: skill
```

### 17.4 Utility Manifest

Example:

```yaml
apiVersion: nd-gen-skills.nexidigital.com/v1
kind: utility
name: read-jira-issue
version: 0.1.0
description: Read Jira issue evidence for workflow skills in read-only mode.
userInstallable: false

skill:
  name: read-jira-issue
  source: skill
```

## 18. Installer Project Layout

V1 implementation repo should keep installer code and bundled package source together.

Recommended layout:

```text
nd-gen-skills/
  package.json
  tsconfig.json
  src/
    cli/
    registry/
    adapters/
      codex.ts
      claude.ts
    installer/
    lockfile/
    agents-md/
    schemas/
    hashing/
  packages/
    provider/
      superpowers/
    contract/
      nexi-workflow-contracts/
    variant/
      frontend-react/
      backend-java/
      mobile-ios/
      mobile-android/
    utility/
      read-jira-issue/
  scripts/
    build-registry.ts
  dist-registry/
    index.yaml
    packages/
```

Rules:

- `src/` contains installer implementation.
- `packages/` contains canonical package source.
- `dist-registry/` is generated build output and included in the npm package.
- Package archives are generated from `packages/`.

## 19. Validation Requirements

`validate` checks installed state without running AI workflows.

It should verify:

- lockfile exists and parses
- lockfile schema is valid
- selected tool folder exists
- all managed files exist
- managed file hashes match lockfile
- `AGENTS.md` managed block exists when a runtime is installed
- `AGENTS.md` references the installed runtime skill
- provider capabilities required by variant are present
- runtime references declared in the manifest resolve to installed skills
- contracts required by variant are installed
- utility skills listed in lockfile exist

Local behavior:

- warn on modified managed files

CI behavior:

- fail on modified managed files

## 20. Acceptance Criteria

### 20.1 Basic Install

Given an empty repo, when running:

```bash
npx -y @nexidigital/nd-gen-skills install --variant frontend-react
```

Then:

- `.agents/skills/` exists
- provider skills are installed with upstream names
- `nexi-workflow-contracts` is installed
- `nexi-frontend-react-runtime` is installed
- `.agents/nd-gen-skills.lock.yaml` is written
- root `AGENTS.md` contains the managed block
- no workflow artifact folder is created by the installer

### 20.2 Bare Install Fails

Given no variant argument, when running:

```bash
npx -y @nexidigital/nd-gen-skills install
```

Then the command fails and shows an example using `--variant`.

### 20.3 Idempotent Install

Given `frontend-react` is already installed, when running the same install command again, then it succeeds and behaves like `sync`.

### 20.4 Variant Replacement Requires Flag

Given `frontend-react` is installed, when running:

```bash
npx -y @nexidigital/nd-gen-skills install --variant backend-java
```

Then the command fails and explains `--replace-variant`.

### 20.5 Managed File Change Detection

Given a managed runtime file was edited locally, when running `sync`, then the CLI warns before overwriting.

In CI mode, it fails unless `--force` is passed.

### 20.6 Unmanaged Collision Protection

Given `.agents/skills/brainstorming/` already exists and is not lockfile-managed, when installing the Superpowers provider, then the command fails and does not overwrite the folder.

### 20.7 Utility Skill Lifecycle

When running:

```bash
npx -y @nexidigital/nd-gen-skills add-skill documentation-kit
```

Then:

- the utility skill is installed
- the lockfile records it
- `AGENTS.md` managed block lists it with a short description

When running:

```bash
npx -y @nexidigital/nd-gen-skills remove-skill documentation-kit
```

Then:

- the utility skill managed files are removed safely
- the lockfile no longer records it
- `AGENTS.md` managed block no longer lists it

### 20.8 Claude Install

When running:

```bash
npx -y @nexidigital/nd-gen-skills install \
  --tool claude \
  --variant frontend-react
```

Then skills are installed under `.claude/skills/` and the lockfile is `.claude/nd-gen-skills.lock.yaml`.

## 21. Example User Prompt After Install

After installing the frontend runtime, a user can prompt:

```text
Use nexi-frontend-react-runtime to handle this change:

Add a checkout discount-code field to the cart page.

Expected behavior:
- The user can enter a discount code.
- Empty and expired codes are validated.
- Valid codes update the cart total.
- Include automated, e2e, and manual test design.
```

The runtime then guides the agent to use the provider and Nexi skills in the correct order.

## 22. Open Implementation Notes

- The exact source for the initial Superpowers provider package must be selected during implementation.
- Provider files must be copied into the package source unchanged.
- Package versioning starts internally at `0.1.0`.
- The first frontend/backend/mobile runtime skill content can be minimal but must be valid and internally consistent.
- The runtime skill content should be written carefully because it is the real glue layer. The installer only distributes it.
