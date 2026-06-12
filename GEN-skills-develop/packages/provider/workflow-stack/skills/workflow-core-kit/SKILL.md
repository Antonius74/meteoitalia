---
name: workflow-core-kit
description: Shared workflow-stack templates, schemas, references, and role contracts.
---

# Workflow Core Kit

Use this skill to apply shared workflow foundations only, without architecture-specific overlays.

## Core Workflow Templates

- planning: [`./templates/skills/shared/planning.template.md`](./templates/skills/shared/planning.template.md)
- architecture: [`./templates/skills/shared/architecture.template.md`](./templates/skills/shared/architecture.template.md)
- development: [`./templates/skills/shared/development.template.md`](./templates/skills/shared/development.template.md)
- test-design: [`./templates/skills/shared/test-design.template.md`](./templates/skills/shared/test-design.template.md)
- orchestration: [`./templates/skills/shared/orchestration.template.md`](./templates/skills/shared/orchestration.template.md)
- unit-testing: [`./templates/skills/shared/unit-testing.template.md`](./templates/skills/shared/unit-testing.template.md)
- automation-test-writing: [`./templates/skills/shared/automation-test-writing.template.md`](./templates/skills/shared/automation-test-writing.template.md)
- automation-test-running: [`./templates/skills/shared/automation-test-running.template.md`](./templates/skills/shared/automation-test-running.template.md)

## Shared Agent Roles

- planner: [`./templates/agents/shared/planner.template.toml`](./templates/agents/shared/planner.template.toml)
- architect: [`./templates/agents/shared/architect.template.toml`](./templates/agents/shared/architect.template.toml)
- developer: [`./templates/agents/shared/developer.template.toml`](./templates/agents/shared/developer.template.toml)
- test-designer: [`./templates/agents/shared/test-designer.template.toml`](./templates/agents/shared/test-designer.template.toml)
- unit-tester: [`./templates/agents/shared/unit-tester.template.toml`](./templates/agents/shared/unit-tester.template.toml)
- automation-test-writer: [`./templates/agents/shared/automation-test-writer.template.toml`](./templates/agents/shared/automation-test-writer.template.toml)
- automation-test-runner: [`./templates/agents/shared/automation-test-runner.template.toml`](./templates/agents/shared/automation-test-runner.template.toml)

## Rules

- Keep workflow semantics in core templates only.
- Add exactly one variant kit when architecture-specific overlays are required.
