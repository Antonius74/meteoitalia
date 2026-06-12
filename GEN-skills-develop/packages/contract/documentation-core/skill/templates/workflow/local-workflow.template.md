<!-- template-id: workflow-local -->

# [Local Workflow Name]

> Canonical local workflow document for a recurring flow inside one bounded area of the repository.
> Keep it close to the implementation and focused on what is specific to this area.

## Scope of This File

- **Scope type:** `local-workflow`
- **This file exists to:** explain a recurring local workflow, its triggers, entry points, validations, and area-specific exceptions.
- **This file must not:** restate repository-wide workflow steps unless this area has a meaningful specialization.

## Workflow Purpose

- **Workflow name:** [name]
- **Area covered:** [bounded area]
- **Starts when:** [trigger condition]
- **Ends when:** [completion condition]
- **Out of scope:** [things this workflow does not cover]

## Preconditions

- [local dependency, fixture, secret, environment, or branch requirement]

## Typical Entry Points

| Entry Point | Purpose | Notes |
|---|---|---|
| [path or command] | [why contributors start here] | [notes] |

## Local Sequence

1. [step one]
2. [step two]
3. [step three]

## Validation and Review Focus

- **Primary validation:** [tests, checks, or manual verification]
- **Review-sensitive areas:** [contracts, concurrency, data changes, auth, UI regressions]
- **Failure recovery:** [what to do if the workflow fails]

## Local Exceptions

- **Repository-wide step not used here:** [exception]
- **Local specialization:** [difference from repo-wide workflow]
- **Escalate to:** [owner or team]

## Maintenance Rule

Update this file when local triggers, steps, validations, or exceptions materially change.
