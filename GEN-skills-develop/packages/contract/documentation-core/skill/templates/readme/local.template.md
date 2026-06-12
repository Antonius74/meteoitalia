<!-- template-id: readme-local -->

# [Local Boundary Name]

> Canonical local-level entry point for a bounded area of the repository.
> Keep it concise, close to the implementation, and specific to this area.

## Scope of This File

- **Scope type:** `local`
- **This file exists to:** explain what this local area does, what it owns, how it fits into the repository, and what local constraints or workflows matter here.
- **This file must not:** restate repository-wide rules, duplicate global setup instructions, or replace architecture, workflow, plan, or test documentation that already exists elsewhere.

## Parent Repository Documents

- **Repository entry point:** `{{root_readme_path}}`
- **Canonical architecture:** `{{root_architecture_path}}`
- **Repository workflow entry point:** `{{root_workflow_path}}`
- **Plans or delivery context:** `{{root_plans_path}}`

## Local Purpose

- **What this area is:** [one-sentence description]
- **Why it exists:** [business or technical purpose]
- **Primary responsibility:** [what this area owns]
- **Out of scope:** [what this area explicitly does not own]

## Local Ownership and Responsibilities

| Responsibility | Description | Notes |
|---|---|---|
| [responsibility] | [what this area owns] | [notes] |

## Local Boundaries

| Boundary Type | In Scope | Out of Scope | Notes |
|---|---|---|---|
| Business capability | [scope] | [not owned here] | [notes] |
| Technical boundary | [scope] | [not owned here] | [notes] |

## Key Paths

| Path | Purpose | Notes |
|---|---|---|
| `./` | [local root purpose] | [notes] |
| `{{local_key_subpath}}` | [purpose] | [notes] |

## Dependencies and Interfaces

| Dependency or Interface | Direction | Purpose | Notes |
|---|---|---|---|
| [dependency] | [inbound or outbound] | [purpose] | [notes] |

## Local Workflow

- **Primary command:** [command]
- **Primary validation:** [test or check]
- **Review focus:** [local risks]

## Maintenance Rule

Update this file when local ownership, boundaries, setup, commands, dependencies, or review-sensitive behavior materially change.
