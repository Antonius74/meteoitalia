# Frontend Overlay: Test Design

Apply this overlay after the shared test-design template.

- Add component/unit coverage for state transitions and event handling.
- Apply `references/api-consumer-contract.md` for API mapping, degraded-state, and unavailable-service cases.
- Add browser automation or manual tester flows for core user journeys and failure fallbacks, depending on the suite execution strategy.
- Include accessibility assertions for critical interaction paths.

## Playwright E2E Design Rules (Mandatory)

For frontend workflows, automation design must be Playwright-oriented and E2E-runnable.
Use `TC-E2E-*` as the canonical frontend browser E2E case.

Only cases that are truly browser-journey automation and are marked
`Automation channel: browser_e2e` or `Automation channel: playwright_e2e` may
enter the Playwright E2E queue.

Every Playwright-eligible requirement must have at least one `TC-E2E-*`.
Functional UI interaction contracts (presence/absence/actionability of controls such as back/close/modal CTAs) must be represented in `TC-E2E-*`.

### Frontend Automation Generation Order
For frontend workflows, generate automation in this order:
1. Generate all required `TC-U-*` behavior coverage.
2. Generate all required `TC-E2E-*` end-to-end coverage across channels.
3. Classify each `TC-E2E-*` by `Automation channel`.
4. Generate all required `TC-M-*` manual coverage.
5. Generate the Playwright scenario from eligible browser `TC-E2E-*` cases.

This prevents unit, integration, API, or non-browser automatic checks from being
mistakenly converted into browser scenarios.

### Frontend E2E Acceptability Gate
No frontend `TC-E2E-*` design is acceptable unless all of the following are true:
- complete copy assertions are defined for the scoped user-visible copy inventory
- accessibility baseline assertions are defined for the scoped critical interaction path
- OTP automation is designed whenever the flow exposes a deterministic retrievable OTP contract

If one of these conditions is not satisfied:
- do not mark the scenario as complete
- do not silently weaken coverage
- record the exact blocker and its impact on automation feasibility

### 1) Mandatory ID and Traceability Model
- keep `REQ-* -> TC-U-*`, `REQ-* -> TC-E2E-*`, and `REQ-* -> TC-M-*` mapping explicit
- keep `REQ-* -> TC-E2E-*` complete even when no Playwright-runnable case exists
- every `TC-E2E-*` must reference:
  - one or more `REQ-*`
- requirements excluded from Playwright E2E by policy (analytics/telemetry/observability-only) must be marked explicitly as `N/A (excluded from Playwright E2E policy)` in traceability

### 2) Journey Bootstrap Must Be Realistic
Every `TC-E2E-*` must explain how to reach the target page from a real entry point:
- start from login or documented public entry
- execute required intermediate steps
- avoid direct deep-link landing unless direct-access is the scenario itself
- declare the exact step-gate boundary (route/state) where the behavior becomes applicable

### 3) Data and Environment Contract Must Be Explicit
For each `TC-E2E-*`, define:
- user/account prerequisites (role, status, permissions)
- required domain data and fixture state
- runtime assumptions (bank flavor, locale, feature flags, integrations)
- dynamic data source (for example OTP retrieval endpoint) when needed
- OTP retrieval and submission contract when the flow includes OTP and a deterministic retrievable contract exists
- centralized runtime input strategy (project E2E config + env overrides)
- explicit route/state applicability (for example "valid from `<step-X>` onward")

### 4) Coverage Rules Per Requirement
For each meaningful `REQ-*` in Playwright functional scope, include E2E coverage for:
- happy path
- validation failures (missing/invalid input)
- authorization/session failures
- backend/business error branches
- interruption/navigation branches (back, close, cancel, confirm)

### 5) Assertion Quality Standard
Each `TC-E2E-*` must include deterministic assertions on:
- URL transition or non-transition
- key control visibility/enabled state
- expected feedback (modal, error, toast, outcome)
- final branch state
- log/runtime error expectation

Do not use generic statements such as "works correctly".

### 6) Interaction Contract Requirements
When header/modal/stepper are in scope, include explicit E2E cases for:
- back and close controls
- modal actions (`X`, secondary CTA, primary CTA)
- cancel paths that keep the user on the current step
- prevention of unintended redirect before confirmation

### 7) Accessibility and Responsive Requirements
Critical interaction paths must include Playwright checks for:
- ARIA role/label presence
- keyboard behavior (`Tab`, `Shift+Tab`, `Escape`)
- focus behavior while modal is open

Accessibility baseline coverage is mandatory for every frontend Playwright scenario in functional scope. If baseline accessibility assertions cannot be designed, the blocker must be recorded explicitly.

And at least one responsive parity case:
- desktop baseline
- one mobile viewport
- same functional outcome across breakpoints

### 8) Analytics and Telemetry Exclusion
For analytics/telemetry/observability requirements:
- do not generate `TC-E2E-*`
- keep coverage in `TC-U-*` and/or `TC-M-*` intent only
- mark Playwright traceability as `N/A (excluded from Playwright E2E policy)`

### 9) Execution Feasibility Declaration
Each `TC-E2E-*` must be marked:
- `Fully automated` when runnable end-to-end with Playwright
- `Manual support needed` only if unavoidable, with exact blocking step and reason

### 10) Stability Requirements for Playwright Conversion
Design `TC-E2E-*` so implementation can be robust:
- prefer stable selectors/contracts (`id`, semantic roles, deterministic attributes)
- avoid timing-based assumptions as acceptance criteria
- ensure failures are diagnosable with clear expected/actual outcomes

### 11) Copy Validation In Playwright E2E (Mandatory)
For requirements involving user-visible copy, generate dedicated `TC-E2E-*` cases that validate copy in real runtime.

Mandatory rules:
- start from the `Content And Localization Inventory` in `requirements.md`; if scoped user-visible copy exists but the inventory is missing or incomplete, raise a blocker instead of generating partial copy coverage
- build an exhaustive copy coverage inventory for the scoped flow before generating `TC-E2E-*` / `TC-M-*`
- every distinct copy surface/state/variant in that inventory must map to at least one `TC-E2E-*` or `TC-M-*`, unless explicitly marked `N/A` with reason
- validate exact copy (`strict exact match`) for critical texts in scope:
  - page title/subtitle
  - field labels and placeholders
  - CTA labels
  - modal/popup title, body, CTA labels
  - validation and business/technical messages (when deterministic for the scenario)
- do not collapse multiple Figma copy surfaces into one generic copy case unless the grouped items share the same literal text, UX role, source reference, and locale/bank applicability
- when multiple distinct copy items appear in the same screen/state, generate coverage that enumerates each expected string explicitly in the case design or assertions
- do not mark copy validation as visual-only; it is functional acceptance coverage
- do not derive expected text from frontend source code, translation modules, or local constants
- expected copy must be sourced from the approved delivery artifact source of truth for the run:
  - Figma when design copy is the approved source of truth
  - CMS when CMS-managed copy is explicitly approved as the source of truth
  - Jira only when it is the only approved explicit copy source available
- runtime/frontend source code is validation evidence, not the source of truth for expected copy
- when copy source differs by locale/bank flavor, define explicit dataset and expected values per variant
- if exact copy cannot be deterministically asserted yet (missing approved source/value), keep the test as `Manual support needed` with explicit blocker; do not silently weaken the assertion

Design output must make copy traceability explicit:
- `REQ-* -> TC-E2E-*` and `REQ-* -> TC-M-*` mapping for copy cases
- source reference for each strict-copy assertion (for example `CMS key` and linked Jira/Figma artifact)
- a `Copy Coverage Matrix` mapping every inventory row to its covering `TC-E2E-*` / `TC-M-*`, or marking it `N/A` with explicit reason
- grouped coverage rationale whenever one case intentionally covers multiple copy inventory rows

## Recommended Automation Entry Structure

Use this structure for `TC-E2E-*` entries:
- **Requirement**
- **Action / Request**
- **Preconditions**
- **Test data**
- **Execution mode**
- **Expected outcome**
- **Assertions**
- **Log assertion**

Keep wording implementation-agnostic but precise enough for direct Playwright implementation.
