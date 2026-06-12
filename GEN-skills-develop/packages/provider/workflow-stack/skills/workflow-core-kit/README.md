# Workflow Core Reference Library

Shared `knowledge-pack` for workflow templates and architecture overlays used by the consolidated workflow skills stack.

## Scope and Ownership

- In scope:
  - shared workflow phase templates
  - shared + variant role templates
  - backend/frontend/mobile-android/mobile-ios overlay deltas
  - shared API producer and consumer contracts used across workflow phases
  - compatibility mappings for legacy workflow assets
- Out of scope:
  - generic documentation templates/schemas (`documentation-core` owns those)
  - skill-private implementation constraints that should stay in `skills/<id>/...`

## Canonical Consumers

- `workflow-delivery-kit`
- `workflow-core-kit`
- `workflow-planning-kit`
- `workflow-architecture-kit`
- `workflow-development-kit`
- `workflow-test-design-kit`
- `workflow-orchestration-kit`
- backend-specialized kits that depend on workflow foundations

## Layered Model

- `templates/skills/shared`: architecture-agnostic workflow templates.
  - includes validation phase contracts for unit testing, automation authoring,
    and automation running.
  - also includes canonical output scaffolds (`requirements-template.md`, `implementation-plan-template.md`, `api-contract-template.md`, `test-cases-template.md`, `workflow-state-template.yml`).
- `templates/skills/backend`: backend overlay deltas.
- `templates/skills/frontend`: frontend overlay deltas.
- `templates/skills/mobile-android|mobile-ios`: platform-specific mobile overlay deltas.
- `templates/agents/shared`: shared role templates.
- `templates/agents/backend|frontend|mobile-android|mobile-ios`: variant role overlays.
- `references/api-producer-contract.md`: API creation and server-side contract guidance.
- `references/api-consumer-contract.md`: API mapping and client-side consumption guidance.

## Composition Rule

1. Start from the closest shared template.
2. Apply exactly one architecture overlay (`backend`, `frontend`, `mobile-android`, or `mobile-ios`).
3. Add skill-specific constraints in the owning skill package.
4. Apply API producer or consumer references when the workflow phase touches an API boundary.

## Variant Execution Rule

Workflow-stack phase skills stay architecture-agnostic. The shared skill owns
the lifecycle, artifact semantics, handoff rules, and exit criteria. The
selected variant overlay owns stack-specific commands, tools, environments,
test strategy details, and evidence expectations.

TDD and validation follow the same rule: the shared `tdd` skill and shared
validation phase contracts define the behavior discipline and workflow
lifecycle, while backend, frontend, mobile-android, and mobile-ios overlays
define the concrete strategy for API checks, browser flows, device/simulator
coverage, lifecycle handling, offline behavior, and runtime evidence.

Variant-scoped installable skills are allowed only for helper capabilities that
do not replace a workflow-stack phase. For example, a toolchain helper such as
`mobile-android-layout-inspector` is valid; a variant-specific replacement such
as `backend-workflow-development-kit` is not. Add stack-specific behavior to
variant overlays instead of creating variant-specific planning, architecture,
development, test-design, orchestration, TDD, or validation phase packages.

## Consolidated Workflow Stack Alignment

`workflow-stack` / `workflow-kit` installer aliases expand to the shared workflow package set:

- `workflow-planning-kit`
- `workflow-architecture-kit`
- `workflow-development-kit`
- `workflow-test-design-kit`
- `workflow-orchestration-kit`
- `workflow-us-quality-assessment-kit`

Variant-aware installs (`--variant backend|frontend|mobile-android|mobile-ios`) prune non-selected workflow-core overlays during install.

## Dependency Rule

- Use `workflow-core` when a skill needs workflow orchestration or role templates.
- Use `documentation-core` when a skill needs documentation standards/templates only.
- Use both only when one skill intentionally spans both documentation and workflow concerns.

## Architecture Governance Location

Architecture-facing governance guidance is maintained alongside the architecture workflow skill:

- [`skills/workflow-architecture-kit/src/body.md`](../../skills/workflow-architecture-kit/src/body.md)

## Compatibility Reference

- [`examples/portal-be-codex-mapping.md`](./examples/portal-be-codex-mapping.md)

## Validation

From this package root:

```bash
bash scripts/validate.sh
```

From repository root:

```bash
python3 cli/skillctl.py validate --package workflow-core
```
