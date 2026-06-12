<!-- template-id: workflow-repository -->

# [Repository Workflow Name]

> Canonical repository-wide workflow document for a recurring operational or delivery flow.
> Keep this file specific to how work actually moves through the repository.

## Scope of This File

- **Scope type:** `repository-workflow`
- **This file exists to:** explain a recurring repository-wide workflow, its triggers, actors, sequence, validations, and handoffs.
- **This file must not:** replace repository architecture documentation, detailed feature design, or a temporary plan.

## Workflow Purpose

- **Workflow name:** [name]
- **What it covers:** [one-sentence description]
- **Starts when:** [trigger condition]
- **Ends when:** [completion condition]
- **Out of scope:** [things this workflow does not cover]

## Preconditions

- [required access, tool, environment, or prerequisite state]

## Actors and Responsibilities

| Actor | Responsibility | Notes |
|---|---|---|
| [role or team] | [what they do in this workflow] | [notes] |

## Entry Points and Triggers

| Trigger | Entry Point | Expected Outcome | Notes |
|---|---|---|---|
| [trigger] | [command, event, or decision] | [outcome] | [notes] |

## Main Sequence

1. [step one]
2. [step two]
3. [step three]

## Artifacts and Handoffs

| Artifact or Handoff | Produced By | Consumed By | Notes |
|---|---|---|---|
| [artifact] | [role] | [role] | [notes] |

## Validation and Controls

- **Required validation:** [tests, checks, approvals, or gates]
- **Critical failure points:** [where mistakes are expensive]
- **Rollback or recovery path:** [what happens when the workflow fails]

## Exceptions and Escalation

- **Known exception:** [condition]
- **Escalate to:** [owner or team]
- **Decision record location:** [link if applicable]

## Related Documentation

- [`README.md`](../README.md)
- [`ARCHITECTURE.md`](../ARCHITECTURE.md)

## Maintenance Rule

Update this file when triggers, actors, sequence, validations, controls, handoffs, or exceptions materially change.
