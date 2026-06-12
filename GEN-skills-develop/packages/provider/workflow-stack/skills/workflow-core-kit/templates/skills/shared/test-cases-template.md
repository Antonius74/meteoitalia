# Test Cases

> **Generated:** {{DATE}}
> **Based on:** {{REQ_FILE}}

---

## Suite Execution Strategy

- **Strategy:** `<!-- fully_automated | manual_only | mixed | blocked -->`
- **Required services:** `<!-- backend APIs, auth provider, database, devices, third-party systems, etc. -->`
- **Environment readiness:** `<!-- ready | partially ready | blocked -->`
- **Coverage model:** every in-scope requirement must have `TC-U`, `TC-E2E`, and `TC-M` coverage intent, even when E2E or manual coverage is high-level or blocked.
- **Notes:** `<!-- explain missing dependencies or strategy decisions -->`

---

## Unit / Behavior Test Backlog

Use these `TC-U-xxx` cases as the development backlog. The Developer implements
one unit/behavior case at a time with red-green-refactor.

{{UNIT_STUBS}}

---

## End-to-End Test Backlog

Use these `TC-E2E-xxx` cases after development as automated end-to-end
validation, or as blocked-flow tracking when dependencies are unavailable.

{{E2E_STUBS}}

---

## Manual Test Backlog

Use these `TC-M-xxx` cases for tester handoff, exploratory confirmation,
business sign-off, device/browser checks, or high-level manual validation when
automation is not enough.

{{MANUAL_STUBS}}

---

## Automated Execution Queue

List `TC-E2E-xxx` cases whose `Execution mode` is `fully_automated` and whose
required services are available.

For each listed case include:
- automation channel
- execution target or harness
- reason this case belongs to automation

This queue is the canonical automation backlog for the workflow.

<!-- Omit this section for manual_only suites. -->

{{VARIANT_TEST_CASE_SECTIONS}}

---

## Manual Test Handoff

List `TC-M-xxx` cases that are ready for tester execution.

For each manual case include:
- tester prerequisites
- test data
- step-by-step actions
- expected result
- evidence to capture

<!-- Omit this section for fully_automated suites. -->

---

## Blocked Acceptance Flows

List `TC-E2E-xxx` or `TC-M-xxx` cases blocked by missing dependencies. Mark
E2E cases with `Execution mode: blocked_by_dependency`.

For each blocked case include:
- missing dependency
- owner or team needed to unblock
- substitute validation evidence
- risk if left unexecuted

---

## Development-Discovered Test Cases

Append behavior cases discovered during development here. Do not rewrite or
renumber approved cases above.

---

## Traceability Matrix

{{TRACEABILITY_MATRIX}}
