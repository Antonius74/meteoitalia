# Development Template (Shared)

## Purpose
Implement the approved plan in sequence, drive behavior through the approved
`TC-U-xxx` unit/behavior backlog, validate continuously, and hand off code that
is buildable, tested, and documented.

## Inputs
- `implementation-plan.md`
- `api-contract.md` when present for the run
- `test-cases.md`
- repository `README.md`
- installed `tdd` skill principles
- existing source conventions

## Output
- source changes implementing the plan
- executable tests for applicable `TC-U-xxx` cases
- a completion summary with changed files, validation status, and `TC-E2E-xxx` / `TC-M-xxx` readiness

## Progress Reporting
Emit progress messages exactly in the orchestration protocol format:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Send one `[PROGRESS]` message after each numbered step below. Send `[DONE]`
only after implementation, validation, and completion reporting are done, or
after an explicit blocker is reported.

## Step-by-Step Process

### 1. Read Workflow State And Repository Rules
Locate the run-specific artifact paths from `<run_dir>/workflow-state.yml`,
including `artifacts.implementation_plan`, `artifacts.test_cases`, and
`artifacts.api_contract` when present.

Before changing code, read the repository `README.md` and any relevant local documentation to confirm:
- runtime and framework
- build and test commands
- naming and structure conventions
- dependency management rules

Read and apply the installed `tdd` skill. Approved workflow artifacts satisfy
the TDD planning approval step unless the artifacts conflict or leave a P0
behavior ambiguous.

If `artifacts.api_contract` exists, read it before implementing API boundary
code. Treat it as an authoritative constraint for endpoint, payload,
status/error, compatibility, and consumer mapping details. Stop and report any
conflict between `api-contract.md`, `implementation-plan.md`, and
`test-cases.md` rather than choosing a behavior.

### 2. Read The Implementation Plan And Test Cases
Read `implementation-plan.md`, the Architecture skill output, before touching
files. Understand the declared execution order and the `REQ-xxx` mapping.

Read `test-cases.md` and use `TC-U-xxx` unit/behavior cases as the TDD backlog:
- process cases in development order
- respect dependencies between cases
- start with P0 tracer bullets
- use `TC-E2E-xxx` and `TC-M-xxx` cases as final validation/manual readiness
  context, not as the normal TDD loop

### 3. Execute One Red-Green-Refactor Cycle Per TC-U
For each applicable `TC-U-xxx`:
- RED: write one executable test through the public interface and confirm the expected failure
- GREEN: implement the smallest production change needed to pass
- VERIFY: run the focused test and relevant build/type/lint command
- REFACTOR: refactor only while green and rerun the focused test

Do not write all tests first. Do not add speculative behavior for later cases.
Mock or stub only true system boundaries.

### 4. Keep Structural Changes Aligned With The Plan
The implementation plan remains the source of truth for file paths, module
ownership, and planned steps.

For each step:
- create the new file exactly where specified, or
- modify the existing file as specified while preserving unrelated behavior

Keep the change scoped to the active step.

### 5. Record Development-Discovered Test Gaps
When implementation reveals a missing behavior case, append it to the
Development-discovered Test Cases section in `test-cases.md`.

Do not rewrite approved cases or renumber existing IDs.

### 6. Run Final Build And Test Verification
When all applicable `TC-U-xxx` cases pass, run the full validation command
required by the repository for that change class.

The final state must be clean enough for the next phase to reason over reliably.

Review `TC-E2E-xxx` flows and `TC-M-xxx` manual cases and report whether they
are automated-ready, manual-ready, or blocked by missing dependencies. Optional
E2E blockers should be recorded with substitute validation evidence rather than
hidden.

### 7. Document What Was Implemented
Add or update documentation for public or exported behavior where the repository expects it.

For non-obvious logic, add brief explanatory comments only where they materially reduce ambiguity.

### 8. Report Completion
Record:
- which implementation steps were completed
- which `TC-U-xxx` cases were implemented
- which files changed
- what validation was run
- whether all TDD tests passed
- `TC-E2E-xxx` and `TC-M-xxx` readiness or blockers

## Handling Fix Requests
When a later phase reports a failure:
- identify the failing requirement or test
- locate the minimal affected scope
- add or update a behavior-focused test that reproduces the failure
- apply the smallest correct production fix
- rerun the relevant validation
- report what changed and why

## Verification Checklist
- [ ] All implementation plan steps were completed or explicitly deferred
- [ ] `implementation-plan.md` was consumed as the Architecture skill output and structural source of truth
- [ ] `api-contract.md` was consumed when present and artifact conflicts were reported before implementation
- [ ] `test-cases.md` was consumed as the TDD backlog
- [ ] Applicable `TC-U-xxx` cases were processed in development order
- [ ] Each `TC-U-xxx` had a red-green-refactor cycle
- [ ] File paths and ownership stayed aligned with the plan
- [ ] Validation commands passed after the final change set
- [ ] Development-discovered cases were appended without rewriting approved cases
- [ ] `TC-E2E-xxx` and `TC-M-xxx` readiness or blockers were reported
- [ ] Changes follow repository naming and structure conventions
- [ ] Documentation was updated where the codebase expects it
