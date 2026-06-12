# Implementation Plan

> **Generated:** {{DATE}}
> **Based on:** {{REQ_FILE}}
> **Total Steps:** {{STEP_COUNT}}

---

## Overview

<!-- 2-3 sentence summary of what this iteration implements and which modules are touched -->

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| <!-- e.g. local state vs. shared store --> | <!-- choice made --> | <!-- why --> |

---

## Implementation Steps

<!--
Each step covers one file (CREATE or MODIFY).
Every step must include all sections below that apply:

  - Responsibility   — the single, well-defined purpose of this module
  - Public interface — every function/method/class/symbol to add or change:
                       name · parameters (name + type) · return type · one-line description
  - Internal logic   — key algorithm, rules, validations, or processing steps
                       the implementation must follow
  - Dependencies     — what this module imports or calls, and how (injected / imported)
  - Error cases      — which errors to raise or return and under what conditions
  - Constraints      — naming rules, validation rules, invariants that must hold

Omit a section only when it genuinely does not apply (e.g. a pure data model
has no internal logic beyond field definitions).
-->

{{STEP_STUBS}}

<!--
Step example:

### Step N: <Component Name>
- **Requirement:** REQ-001, REQ-003
- **Action:** CREATE
- **File:** `src/<module>/<component>.<ext>`
- **Responsibility:** <one sentence — what this module does and nothing else>
- **Public interface:**
  - `functionName(param1: Type, param2: Type) → ReturnType` — <what it does>
  - `anotherFunction(param: Type) → ReturnType` — <what it does>
- **Internal logic:**
  1. <First processing step>
  2. <Second processing step — include rules, guards, algorithms>
- **Dependencies:** imports `<OtherModule>` (injected via constructor / imported directly)
- **Error cases:** raises `<ErrorType>` when <condition>
- **Constraints:** <naming convention, validation rule, or invariant>
-->

---

## Configuration Changes

| Key | Value / Source | Purpose |
|-----|----------------|---------|
| <!-- config key or env var name --> | <!-- default value or env source --> | <!-- what it controls --> |

---

## Dependency Changes

List packages to add via the project's package manager (see README.md for the exact command):

| Package | Purpose |
|---------|---------|
| <!-- package name --> | <!-- what it provides --> |

---

## Risks & Assumptions

> This table is reviewed during Gate 2 with the rest of the design artifacts.
> Mark unresolved items as awaiting Gate 2 approval rather than stopping before
> the draft plan is written.

| # | Risk or Assumption | Impact if Wrong | Mitigation | Status |
|---|-------------------|-----------------|------------|--------|
| R-01 | <!-- describe the risk or assumption --> | <!-- what breaks or changes --> | <!-- how it is mitigated --> | Awaiting Gate 2 approval |

**Gate 2 decision:** <!-- Approved / Revision requested — add date and any notes -->

---

## Traceability Matrix

{{TRACEABILITY_MATRIX}}
