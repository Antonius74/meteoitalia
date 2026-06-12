<!-- template-id: plan-execution -->

# [Execution Plan Name]

> Stepwise implementation plan for a concrete change.
> Use this file when sequencing, validation, and rollback details matter.

## Metadata

- **Status:** [draft, active, blocked, completed]
- **Owner:** [person or team]
- **Target area:** [repository or local boundary]
- **Last updated:** [date]

## Goal

- **Outcome:** [what will be true when execution is complete]
- **Non-goals:** [what this execution plan will not do]

## Current State vs Target State

- **Current state:** [starting point]
- **Target state:** [end state]
- **Main gap:** [what must change]

## Sequenced Changes

| Order | Change | Why It Happens Here | Validation |
|---|---|---|---|
| 1 | [change] | [reason] | [validation] |
| 2 | [change] | [reason] | [validation] |

## Checkpoints

- **Checkpoint 1:** [expected state after early changes]
- **Checkpoint 2:** [expected state before completion]

## Rollout and Rollback

- **Rollout path:** [how the change is introduced]
- **Rollback trigger:** [what condition causes rollback]
- **Rollback method:** [how to revert safely]

## Blockers and Dependencies

- [blocker or dependency]

## Completion Rule

- **Done when:** [specific completion condition]

## Update Rule

Update this file when the change sequence, checkpoints, validations, blockers, or rollback path materially change.
