---
name: workflow-orchestration-kit
description: Coordinate multi-phase workflow-stack delivery with gates, state, progress, and fix loops.
---

# Orchestration Skill — Master Workflow Coordinator

## Purpose
Coordinate all agents across the 11-phase development workflow, enforce human
approval gates, manage fix loops, monitor subagent progress, and track workflow
state in `<run_dir>/workflow-state.yml`.

## Quickstart
Initialise workflow state and print the execution plan:
```bash
python ./scripts/init_orchestration.py \
    --issues PROJ-101 PROJ-102 \
    --branch feature/my-feature \
    --run PROJ-101-102_my-feature
```

The `--run` value is the **leaf folder name** for this workflow run. Choose a
short, descriptive slug combining the Jira key(s) and a feature summary
(e.g. `PROJ-205_checkout-flow`, `JIRA-123-234_credential-recovery`). All
agent-produced Markdown artefacts for this run are stored under
`.workflows/<run>/`. The full path is recorded in `<run_dir>/workflow-state.yml`
as `workflow.run_dir` and in each `artifacts.*` field — always read it from
there and pass it to every subagent handoff rather than constructing the path
yourself.

## Phase Sequence

| Phase | Agent(s) | Parallel | Human Gate |
|-------|----------|----------|-----------|
| 1 — Planning | `planner` | No | No |
| 2 — Requirements Review | — | — | **Gate 1** |
| 3a — Architecture | `architect` | **Yes (with 3b)** | No |
| 3b — Test Design | `test-designer` | **Yes (with 3a)** | No |
| 4 — Design Review | — | — | **Gate 2** |
| 5 — Development | `developer` | No | No |
| 6 — Code Review | — | — | **Gate 3** |
| 7a — Unit Testing | `unit-tester` → `developer` loop | **Yes (with 7b)** | No |
| 7b — Automation Test Writing | `automation-test-writer` | **Yes (with 7a)** | No |
| 8 — Pre-Deploy Review | — | — | **Gate 4** |
| 9 — Deploy | CI/CD pipeline | No | No |
| 10 — Acceptance/E2E Validation | `automation-test-runner` / manual testers → `developer` loop when executable | No | No |
| 11 — Result Gate | — | — | No |

## Human Gate Protocol
1. **Stop** all agent activity
2. Present artefacts to the human (list file paths and key contents)
3. Ask: "Do you approve? If not, what should change?"
4. **Wait** — never proceed without explicit approval
5. If rejected: parse feedback, re-spawn affected agents with the change appended
6. If approved: advance to the next phase; update `<run_dir>/workflow-state.yml`

## Loop Limits
- Unit test fix loop: max **5** iterations before escalating to human
- Automation test writing: single pass (no loop — writer produces test files, runner executes them)
- Acceptance/E2E validation cycle: max **3** executable cycles before escalating to human

Acceptance/E2E validation is conditional. Use `test-cases.md` to distinguish:
- `TC-E2E-xxx` flows marked `fully_automated` that can run now
- `TC-M-xxx` manual cases that must be handed to testers
- `TC-E2E-xxx` / `TC-M-xxx` cases blocked by dependencies that cannot run until required services, data,
  credentials, devices, or third-party systems are available

Do not treat unavailable optional E2E dependencies as silent success or as a
mandatory development failure. Record the blocker and substitute validation
evidence, then escalate only when the missing dependency changes release risk.

## State File
See `../workflow-core-kit/templates/skills/shared/workflow-state-template.yml`.

## Role Contracts

When installed as part of `workflow-stack`, the selected workflow variant keeps
the shared role contracts and matching variant role overlays from:

- `../workflow-core-kit/templates/agents/shared`
- `../workflow-core-kit/templates/agents/<variant>`

Use those role templates when spawning or configuring planner, architect,
developer, test-designer, unit-tester, automation-test-writer, and
automation-test-runner agents.

Validation phases also have shared phase contracts:

- `../workflow-core-kit/templates/skills/shared/unit-testing.template.md`
- `../workflow-core-kit/templates/skills/shared/automation-test-writing.template.md`
- `../workflow-core-kit/templates/skills/shared/automation-test-running.template.md`

Use those contracts for validation preconditions, outputs, fix-request formats,
report structure, and exit criteria.

## Subagent Progress Monitoring

Agents send **proactive progress messages** at each skill step boundary — the
orchestrator never polls them. This keeps agents uninterrupted while giving the
orchestrator real-time data to adjust each phase's time budget dynamically.

Every subagent handoff must include the progress reporting contract. Require
the agent to send exactly one `[PROGRESS]` message after each major skill step
and one `[DONE]` message only when that phase's exit criteria are satisfied or
its blocker/fix request is complete.

### Message formats (sent by agents)

```
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

### Protocol

1. **Record a start snapshot** when a subagent is spawned:
   - `spawn_time` — wall-clock timestamp
   - `expected_artefact` — path from `artifacts.*` in `<run_dir>/workflow-state.yml`
   - `current_deadline` — spawn_time + initial budget (table below is the *estimate*,
     not a hard limit)

   | Phase | Initial budget estimate |
   |-------|------------------------|
   | planning, test-design, automation-test-writing | 20 min |
   | architecture | 30 min |
   | development, unit-testing, automation-test-running | 60 min |

2. **Do not contact the agent** while it is running. Wait passively for incoming
   messages.

3. **On each `[PROGRESS]` message received**, update the deadline dynamically:
   - Compute `elapsed = now − spawn_time`
   - Compute `rate = steps_done / total_steps`
   - Project `total_duration = elapsed / rate`
   - Set `current_deadline = spawn_time + total_duration + 20% buffer`
   - If the agent also provided an `est. N min remaining`, use
     `min(projected_deadline, now + agent_est + 20% buffer)` as the new deadline
   - Log the update: `[DEADLINE ADJUSTED] phase=<X> new_deadline=<t> basis=step <N>/<M>`

4. **On `[DONE]` received** — advance the phase immediately. No further checks needed.

5. **Silence detection** — if no `[PROGRESS]` or `[DONE]` message has arrived
   within **30 minutes** of the last received message (or of spawn, if none received),
   fall back to a **file-system check**:
   - If the expected artefact has been modified since the last check → the agent
     is making progress silently; extend the deadline by 15 minutes and wait.
   - If the artefact has NOT changed → declare a stall.

6. **On stall** — stop the agent and **re-spawn with an enriched prompt**:
   - Original task and all inputs unchanged
   - Last known step (from the most recent `[PROGRESS]` message, if any)
   - Any relevant file paths, build output, or log errors
   - A note on what was missing or incomplete in the output file

7. **Count restarts** — a restarted agent inherits the iteration count of the
   original. If a phase exceeds its loop limit (including restarts), escalate to
   the human rather than restarting again.
## Rules

- **Always delegate to specialised agents** — the orchestrator never performs
  planning, design, coding, testing, or deployment work itself. Every phase must
  be executed by its designated agent (see Phase Sequence table). Doing the work
  directly instead of spawning the correct agent bypasses skill loading, tool
  permissions, and model selection optimised for each role.
- **Never skip a phase or gate** — phases must execute in the defined order.
  Human gates (Gate 1, Gate 2, Gate 3, Gate 4) must receive explicit approval before the
  next phase starts; silence or timeout is not approval.
- **Only explicitly parallel phases overlap** — Phase 3a/3b
  (architecture + test-design) and Phase 7a/7b (unit-testing +
  automation-test-writing) may run in parallel. No other phases overlap.
- **Always update `<run_dir>/workflow-state.yml`** at every phase transition — mark the
  completed phase, set `current_phase` to the next, and record gate decisions
  and human feedback in the file.
- **Escalate, never guess** — if a phase agent returns an ambiguous result, or a
  fix loop hits its iteration limit, stop and ask the human rather than making
  an autonomous decision to continue or skip.
- **Preserve traceability** — every handoff message to an agent must include the
  relevant REQ-xxx IDs so the agent can maintain end-to-end traceability through
  to the test report.
- **All agent Markdown output goes to the run directory** — agents must never
  write workflow artefacts to the project root or to the base `.workflows/`
  folder directly. The canonical path for every artefact is recorded in
  `<run_dir>/workflow-state.yml` under `artifacts.*` and `workflow.run_dir`. The orchestrator
  must pass `run_dir` and the relevant `artifacts.*` paths in every agent handoff
  message so agents never construct paths themselves.

## Verification Checklist
After the workflow completes (or at any gate):

- [ ] `<run_dir>/workflow-state.yml` reflects the current phase and all completed phases
- [ ] `workflow.run_dir` is set and all `artifacts.*` paths resolve to files in that directory
- [ ] All four human gates were explicitly approved (not skipped)
- [ ] Unit test fix loop did not exceed 5 iterations
- [ ] Acceptance/E2E validation cycle did not exceed 3 executable cycles
- [ ] `automation-test-report.md` shows executable `TC-E2E-xxx` as PASS, `TC-M-xxx` as handed off, or blocked cases with explicit dependency blockers
- [ ] No open fix requests remain unresolved
- [ ] No agent was left running after a stall was detected
- [ ] All stall events are documented (time, percentage plateau, re-spawn prompt used)
