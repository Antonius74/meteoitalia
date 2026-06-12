# Orchestration Template (Shared)

## Purpose
Coordinate the end-to-end delivery workflow with explicit human gates, deterministic phase transitions, and artifact traceability.

## Inputs
- issue list and run metadata
- branch context
- selected workflow variant

## Output
- `<run_dir>/workflow-state.yml`
- coordinated execution across planning, design, implementation, and validation phases

## Core Responsibilities
- initialize the run directory and workflow state
- sequence the phases correctly
- enforce human approval gates
- coordinate parallel phases only where explicitly allowed
- track retries, stalls, and final status

## Standard Phase Flow
1. Planning
2. Requirements review gate
3. Architecture and test design
4. Design review gate
5. Development
6. Code review gate
7. Unit testing and automation test writing
8. Pre-deploy review gate
9. Deploy
10. Acceptance/E2E validation
11. Final result gate

## Human Gate Protocol
At each gate:
1. stop phase advancement
2. present the relevant artifacts and deltas
3. request explicit approval or revision
4. wait for the decision
5. record the result in workflow state

Silence is not approval.

## Retry And Loop Control
Track loop counts for phases that may iterate, especially:
- unit-test fix cycles
- executable acceptance/E2E validation cycles

When a phase exceeds the allowed retry budget, escalate instead of retrying indefinitely.

## Acceptance/E2E Validation Policy
Use `test-cases.md` to classify validation coverage as:
- `TC-E2E-xxx` flows marked `fully_automated`
- `TC-E2E-xxx` flows marked `blocked_by_dependency`
- `TC-M-xxx` manual cases that are tester-ready, high-level, or blocked

Run automated E2E flows when their required services and environment
dependencies are available. Hand manual cases to testers with explicit steps and
evidence to capture. For blocked flows, record the missing dependency and
substitute validation evidence instead of treating the flow as forgotten or
silently passed.

## Progress Monitoring
Use progress updates, artifact timestamps, or equivalent durable signals to determine whether a delegated phase is still advancing.

Every delegated agent must be instructed to emit progress messages in this
exact format at each skill-step boundary:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

If a phase stalls:
- capture the current evidence
- stop or replace the stalled execution path
- respawn with an enriched prompt only when justified
- preserve the retry count

## State Management
Maintain `<run_dir>/workflow-state.yml` as the canonical run-state file using:
- `templates/skills/shared/workflow-state-template.yml`

Update it at every phase transition with:
- current phase
- completed phases
- approval decisions
- retry counters
- human feedback

## Role Contracts
Use the installed shared and selected-variant role templates from:
- `templates/agents/shared`
- `templates/agents/<variant>`

The orchestrator should use these role contracts when spawning or configuring
phase agents.

Validation phases also have shared phase contracts:
- `templates/skills/shared/unit-testing.template.md`
- `templates/skills/shared/automation-test-writing.template.md`
- `templates/skills/shared/automation-test-running.template.md`

Use those contracts for validation preconditions, outputs, fix-request formats,
report structure, and exit criteria.

## Rules
- Do not skip phases or approval gates
- Do not invent artifact paths; read them from workflow state
- Do not let downstream phases proceed on ambiguous upstream outputs
- Preserve requirement traceability through every handoff
- Keep all workflow artifacts inside the run-specific directory

## Verification Checklist
- [ ] The workflow state reflects the current phase accurately
- [ ] All required approval gates were explicitly recorded
- [ ] Retry counts are current and bounded
- [ ] No stalled phase was left untracked
- [ ] Artifact paths in workflow state resolve to the expected run directory
- [ ] Executable `TC-E2E-xxx`, manual `TC-M-xxx`, and blocked cases are reported separately
