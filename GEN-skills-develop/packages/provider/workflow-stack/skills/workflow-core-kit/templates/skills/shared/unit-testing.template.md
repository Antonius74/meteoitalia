# Unit Testing Template (Shared)

## Purpose
Verify the approved `TC-U-xxx` behavior backlog against the implemented code,
produce deterministic evidence for Gate 4, and create structured fix requests
when production changes are required.

## Inputs
- `<run_dir>/workflow-state.yml`
- `implementation-plan.md`
- `test-cases.md`
- repository `README.md` and local test conventions
- changed source and test files from the development phase

## Output
- unit test execution summary in the agent completion message
- structured fix request to the developer when production behavior must change
- updated or added behavior tests only when they directly map to approved
  `TC-U-xxx` cases or development-discovered cases

## Progress Reporting
Emit progress messages exactly in the orchestration protocol format:

```text
[PROGRESS] step <N>/<M> done - <one-line summary> - est. <N> min remaining
[DONE]     <artifact or validation summary>
```

Send one `[PROGRESS]` message after each numbered step below. Send `[DONE]`
only after exit criteria are satisfied or a blocking fix request has been
prepared.

## Step-by-Step Process

### 1. Read Workflow State And Test Inputs
Read `<run_dir>/workflow-state.yml` and identify:
- `artifacts.implementation_plan`
- `artifacts.test_cases`
- relevant validation commands from repository documentation

Read the implementation plan and the approved `TC-U-xxx` backlog before running
or editing tests.

### 2. Map TC-U Cases To Executable Suites
For each approved `TC-U-xxx`, identify the concrete test file, command, and
public interface that should cover it.

If a case has no executable coverage, add the smallest behavior-focused test
only when it can be derived from approved artifacts without inventing behavior.
Do not modify production code in this phase.

### 3. Run Focused Behavior Tests
Run the focused test commands for changed behavior first.

Capture:
- command
- exit status
- failing test identifier
- requirement or `TC-U-xxx` mapping
- concise failure evidence

### 4. Run Required Broader Validation
Run the repository-level unit or fast validation command required for this
change class. Use README or local workflow documentation as the source of truth.

Do not ignore new warnings that are introduced by the change.

### 5. Produce Fix Requests When Needed
When a production fix is required, stop test expansion and produce a structured
fix request:

```markdown
## Fix Request
- **Source phase:** unit-testing
- **Requirement:** REQ-xxx
- **Test case:** TC-U-xxx
- **Failing command:** `<command>`
- **Failure summary:** <what failed>
- **Expected behavior:** <approved expected behavior>
- **Observed behavior:** <actual behavior>
- **Suspected scope:** <file or module, if known>
- **Evidence:** <short log excerpt or artifact path>
```

Route the fix request to the developer phase. Do not apply the production fix
inside the unit-tester role.

### 6. Report Completion
Report:
- covered `TC-U-xxx` IDs
- commands run
- pass/fail status
- any added or updated behavior tests
- open fix requests, or explicit confirmation that none remain

## Exit Criteria
- Every impacted approved `TC-U-xxx` has executable coverage or a documented
  blocker.
- Focused behavior tests have passed, or a structured fix request has been sent.
- Required broader unit validation has passed when runnable.
- No production code was changed by the unit-tester role.
- `[DONE]` was emitted with the validation status or blocking fix-request status.
