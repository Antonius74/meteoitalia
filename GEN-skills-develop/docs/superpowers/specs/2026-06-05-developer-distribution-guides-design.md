# Developer Distribution Guides Design

Date: 2026-06-05

## Context

`@nexidigital/nd-gen-skills` is distributed to internal Nexi developers through two practical channels:

- a prebuilt local `.tgz` tarball placed in a shared or local folder;
- the published package in the Nexi Artifactory npm registry.

The existing repository documentation explains the package, architecture, installer, providers, variants, utilities, and
release process. The new need is a distributable Codex-only guide pack for developers who may not have access to this
repository and need simple instructions for installing and using the package.

The local tarball path is the primary path. Developers receiving the tarball should not be asked to build the package
from source.

## Goals

- Create a self-contained developer guide pack that can be distributed from `guides/developer-distribution/`.
- Make local tarball installation the primary flow.
- Keep the published-package flow concrete for Nexi Artifactory, using the `@nexidigital` npm scope and `NPM_TOKEN`.
- Cover Codex only in this guide pack.
- Make `superpowers` the default provider.
- Explain how to select and install Superpowers skills through the installer.
- Explain how to follow a Superpowers-supported TDD development stream.
- Explain how to install and use `documentation-kit` to document codebases.
- Explain how to scaffold repository-level and local documentation according to the official governance standard.
- Explain how to use `AGENTS.md` after installation and how the managed Nexi block should be treated.
- Explain how to install, remove, validate, and use specific utility skills.
- Move the official documentation standard PDF into the guide pack so the distributed folder contains the standard.

## Non-Goals

- Do not change CLI behavior, package manifests, registry contents, installer behavior, or skill behavior.
- Do not document Claude in the developer distribution guide pack.
- Do not include tarball build instructions in the developer-facing local tarball guide.
- Do not edit provider skills under `packages/provider/`.
- Do not create a documentation website or generated HTML output.
- Do not replace the existing maintainer-oriented README, architecture, provider, variant, utility, or release guides.

## Guide Pack Structure

The implementation should create this structure:

```text
guides/developer-distribution/
  README.md
  installation/
    README.md
    local-tarball.md
    published-package.md
  workflow/
    README.md
    choose-provider-and-variant.md
    superpowers-tdd.md
    provider-skills.md
  utility-skills.md
  documentation/
    README.md
    document-codebases.md
    AIGOV-Standard_ Documentation Naming and Structure.pdf
```

The PDF should be moved into the distributable guide pack:

```text
guides/developer-distribution/documentation/AIGOV-Standard_ Documentation Naming and Structure.pdf
```

Any existing repository documentation links to the old PDF path should be updated to the new path.

## README Design

`guides/developer-distribution/README.md` should be the guide pack entry point. It should answer:

- I have a local tarball. Where do I start?
- I have Nexi Artifactory access. Where do I start?
- How do I install the default Superpowers setup?
- Which runtime variant should I choose?
- How do I use Superpowers for development and TDD?
- How do I document a codebase?
- How do I install one specific utility skill?

The README should include a short decision table that routes developers to:

| Need | Guide |
| --- | --- |
| Install from a shared or local `.tgz` tarball | `installation/local-tarball.md` |
| Install from Nexi Artifactory | `installation/published-package.md` |
| Choose provider and runtime variant | `workflow/choose-provider-and-variant.md` |
| Use Superpowers with TDD | `workflow/superpowers-tdd.md` |
| Document a codebase | `documentation/README.md` |
| Install a utility skill | `utility-skills.md` |

## Installation Folder Design

`guides/developer-distribution/installation/README.md` should be the installation entry point. It should explain that
developers normally choose one of two install paths:

- local tarball installation from a shared or local `.tgz` archive;
- published package installation from Nexi Artifactory.

It should make local tarball installation the recommended starting point when a developer receives a prebuilt package
archive and should route Artifactory users to the published package guide.

## Local Tarball Guide

`installation/local-tarball.md` is the primary installation guide. It should assume the developer has a prebuilt `.tgz`
package archive and no access to this repository.

It should cover:

- required prerequisites: Node.js 20 or newer, npm, Codex, a target repository, and the provided tarball;
- setting `TARBALL` to an absolute path;
- installing the default Superpowers provider for Codex with a variant;
- choosing another variant;
- installing the governed `workflow-stack` provider only when needed;
- validating the managed installation;
- listing installed and available packages;
- common mistakes such as using a relative tarball path from the wrong directory or omitting `--replace-variant` when
  switching variants.

Primary command shape:

```bash
TARBALL="/absolute/path/to/nexidigital-nd-gen-skills-0.1.0.tgz"
npm exec --yes --package "$TARBALL" -- nd-gen-skills install --variant frontend-react
npm exec --yes --package "$TARBALL" -- nd-gen-skills validate --ci
```

The guide must not include commands for `npm ci`, `npm run prepare`, `npm run pack`, or any other source build step.

## Published Package Guide

`installation/published-package.md` should be the secondary installation guide. It should cover:

- the Nexi Artifactory npm registry URL;
- configuring npm for the `@nexidigital` scope;
- using `NPM_TOKEN`;
- verifying access with `npm view @nexidigital/nd-gen-skills version`;
- installing the default Codex Superpowers setup with `npx`;
- validating and listing the installation;
- using local dependency or global install only as optional alternatives.

The remote path should use concrete Nexi values. A short note may explain that mirrored registries should replace the
registry URL and token source with local team-provided values.

## Workflow Folder Design

`guides/developer-distribution/workflow/README.md` should be the workflow entry point. It should explain that providers
define how agents plan, implement, verify, and document work after installation. It should make `superpowers` the
default workflow provider and describe `workflow-stack` as the governed alternative for Jira or evidence-heavy delivery.

The workflow folder should be structured so future provider guides can be added without reshaping the guide pack. New
provider pages should be linked from `workflow/provider-skills.md` and the workflow README.

## Superpowers Selection Guide

`workflow/choose-provider-and-variant.md` should make `superpowers` the default provider and explain that omitting
`--provider` installs Superpowers.

It should include:

- provider chooser:
  - `superpowers` for default design, planning, TDD, debugging, review, and verification;
  - `workflow-stack` only for governed Jira or evidence-heavy delivery;
- variant chooser:
  - `frontend-react`;
  - `backend-java`;
  - `mobile-ios`;
  - `mobile-android`;
- local tarball commands for each variant;
- published package equivalents;
- validation and list commands.

## Superpowers TDD Guide

`workflow/superpowers-tdd.md` should show how developers use the installed Superpowers skills after installation. It should
be practical and prompt-oriented.

The expected stream is:

1. Use `$brainstorming` to turn an idea into an approved design/spec.
2. Use `$writing-plans` to create the implementation plan.
3. Use `$test-driven-development` for the red-green-refactor loop.
4. Use `$systematic-debugging` when a failure is not understood.
5. Use `$requesting-code-review` or `$receiving-code-review` when review is needed.
6. Use `$verification-before-completion` before claiming work is complete.

The guide should include copy-paste prompt examples for each phase and should explain that the installed runtime variant
adds repository-specific guidance for frontend, backend, iOS, or Android work.

## Provider Skills Guide

`workflow/provider-skills.md` should explain the general model for provider skills:

- provider skills define the workflow phases available to the agent;
- the selected runtime variant adapts those provider skills to a repository type;
- `superpowers` is the default provider for normal feature work;
- `workflow-stack` is the governed provider for structured evidence, workflow artifacts, and traceability;
- future providers should get their own short section or page under `workflow/` without changing installation commands
  unless the provider introduces a new `--provider` value.

The guide should include a provider comparison table and route detailed Superpowers TDD usage to
`workflow/superpowers-tdd.md`.

## Documentation Folder Design

`guides/developer-distribution/documentation/README.md` should be the documentation-specific entry point. It should
route developers to:

- `document-codebases.md`;
- the official PDF standard in the same folder.

It should explain that documentation work should follow the official standard and should use `documentation-kit` when an
agent is asked to create, refresh, or audit codebase documentation.

`document-codebases.md` should cover:

- installing `documentation-kit` from a local tarball;
- installing `documentation-kit` from the published package;
- using the repository source tree as the source of truth;
- scaffolding repository-level documentation;
- scaffolding local documentation boundaries;
- using `AGENTS.md` for installed skill discovery and repository instructions;
- prompt examples for README, architecture, workflow, design, and ubiquitous language documentation.

## Documentation Scaffolding Rules

The guide should summarize the official standard without replacing it.

Repository-level scaffold:

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

Rules:

- `README.md` is mandatory.
- `ARCHITECTURE.md` is mandatory.
- `docs/` is optional.
- `docs/WORKFLOW.md` is optional unless repository-level workflow documentation exists.
- ADRs are optional and should be used selectively.
- Functional and technical workflow documents should use explicit names when that distinction matters.
- Deeper documentation should be added only where it improves implementation, validation, maintenance, operations, or
  handoff quality.

Local boundary scaffold:

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

Rules:

- Do not document every folder by default.
- Add local documentation only for meaningful features, services, capabilities, external integrations, unclear ownership
  areas, recurring ambiguity, or defect-prone boundaries.
- Local docs should stay scoped to the local boundary and should link to repository-wide standards rather than duplicate
  them.

## AGENTS.md Guidance

The guide pack should explain:

- the installer updates a managed Nexi block in root `AGENTS.md`;
- the managed block records the installed provider, runtime variant, contracts, and utilities for agent discovery;
- developers should not manually edit the managed Nexi block;
- repository-specific instructions outside the managed block are preserved;
- developers may add their own repository instructions outside the managed block;
- after installation, normal work should start from the runtime skill listed by the managed block.

## Utility Skills Guide

`utility-skills.md` should explain the generic utility workflow:

- list available utilities;
- add one utility skill;
- remove one utility skill;
- validate the managed state;
- use the installed utility by name;
- understand that dependency-only utilities are not directly user-installable.

It should include local tarball commands first and published package commands second.

It should include examples for:

- `documentation-kit`;
- `tdd`;
- `grill-me`;
- `markitdown`;
- `figma-use`;
- `frontend-react-e2e-test-implementation`;
- backend utility skills;
- `mobile-android-layout-inspector`.

The guide should avoid Codex-only hardcoding inside reusable skill guidance. Since this guide pack is explicitly
Codex-only, it may name `.agents/skills`, but it should keep that scope clear.

## Existing Documentation Updates

Implementation should update existing docs so the new guide pack is discoverable:

- root `README.md` documentation map should link to the developer distribution guide pack;
- `guides/install/README.md` should link to `guides/developer-distribution/installation/local-tarball.md` for users who
  receive a prebuilt archive;
- existing links to the governance PDF should point to the moved PDF path.

The existing maintainer and architecture docs should remain in place. The new guide pack should complement them, not
replace them.

## Verification Plan

Documentation verification should include:

- `git diff --check`;
- manual review that every relative link in the new guide pack resolves;
- manual review that local tarball guides contain no source build commands;
- manual review that all guide-pack install commands are Codex-only;
- manual review that existing references to the moved PDF path are updated;
- `npm test` only if implementation changes source code, package manifests, registry generation, or command behavior.

## Implementation Notes

- Keep the guide pack readable for developers who have no access to this repository.
- Lead with local tarball instructions before published package instructions.
- Keep `superpowers` as the default provider in wording and examples.
- Use `workflow-stack` only as an alternate governed path.
- Use concrete Artifactory configuration for the published path.
- Keep examples copy-pasteable and command syntax aligned with `src/cli/args.ts`.
- Preserve unrelated working tree changes.
