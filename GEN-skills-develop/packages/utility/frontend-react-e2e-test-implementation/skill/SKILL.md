---
name: frontend-react-e2e-test-implementation
description: "Generate one Playwright React E2E scenario from selected TC-E2E cases, with basename-safe routing, deterministic OTP completion when the flow exposes a retrievable OTP contract, and atomic behavior-focused assertions traced to requirements/Figma. Accessibility testing is out of scope and belongs to a separate skill."
---

# Frontend React E2E Test Implementation Skill (Compact)

## Purpose
Generate exactly one executable Playwright scenario file from selected `TC-E2E-*` cases.

The scenario must be:
- requirement-traceable
- runnable against real non-mock flow
- strict on branch intent
- resilient to approved runtime variants

This skill implements browser E2E only. It does not redesign acceptance scope.

---

## Rule Priority (highest to lowest)
1. **Safety rules**
2. **Data rules**
3. **Navigation rules**
4. **Assertion rules**
5. **Diagnostics rules**
6. **Style rules**

If two rules conflict, apply the higher-priority rule and report the conflict.

---

## 1) Input -> Output

### Inputs
- `test-cases.md` path
- selected `TC-E2E-*` IDs (or story/workflow key to derive them)
- target scenario file path:
  `tests/e2e/scenarios/*.e2e.js`
- bank context via `E2E_BANK` (default `mps`)

### Selection derivation (when only story/workflow is provided)
1. Include all rows in **Playwright E2E Derivation Queue**
2. Include all `TC-E2E-*` in **End-to-End Test Backlog** with
   `browser_e2e` or `playwright_e2e` channel
3. Do not drop a case only because it is `blocked_by_dependency`

### Output
- Exactly one created/updated scenario file under `tests/e2e/scenarios/*.e2e.js`
- Optional data updates only in:
  - `tests/e2e/config/e2e.input.local.json` (preferred)
  - `tests/e2e/config/e2e.input.data.js` (shape/env mapping only)
- If missing data is detected for `blocked_by_data` cases, placeholders MUST be auto-prepared in both files above before final output.
- Every `blocked_by_data` case MUST be generated as a conditional test:
  - execute when dataset is present and resolved
  - `test.skip(condition, reason)` only when required data is missing/unresolved
  - never hardcode `test.skip(...)` for `blocked_by_data` unconditionally
- Final report with:
  - implemented `TC-E2E-*`
  - skipped tests + explicit reason
  - `blocked_by_dependency` classification outcome
  - requested/provided missing data status
  - generated placeholder paths/keys for missing data
  - copy assertion scope
  - accessibility handoff exclusions (if any)

### Scope locks
- Never modify:
  - `scripts/test-e2e.js`
  - Playwright global config
  - reporters
  - app source code
- Never edit unrelated files unless explicitly requested.

---

## 2) Decision Tree (if/then)

Use this decision tree before coding.

### A. Safety and source-of-truth
- IF requirement intent is needed  
  THEN derive only from `requirements.md`, `test-cases.md`, Jira wording already captured there, and approved Figma inventory.

- IF frontend runtime behavior conflicts with approved requirements/Figma  
  THEN keep assertions aligned to requirements/Figma and report implementation gap.

- IF upstream `TC-E2E-*` mixes non-browser automation  
  THEN stop and report workflow-design defect.

- IF business intent (journey/copy/branches) is unclear from approved artifacts  
  THEN stop and request clarification.

### B. Blocked case classification (mandatory)
- IF a browser case is `blocked_by_dependency`  
  THEN classify it as exactly one:
  - `blocked_by_data`
  - `blocked_by_others_info` (analytics-only, accessibility-only, pure visual)

- IF blocker is missing local business data (PAN, CV2, fiscalCode, relationshipCode, companyId, email, phone, seeded branch data, etc.)  
  THEN classify `blocked_by_data`.

- IF blocker is external contract/service/third-party test hook  
  THEN classify `blocked_by_others_info`.

### C. Missing-data hard stop
- IF any selected test depends on unresolved local business data  
  THEN auto-generate placeholders in:
  - `tests/e2e/config/e2e.input.local.json`
  - `tests/e2e/config/e2e.input.data.js` (only shape/env mapping if needed)
  and ask user explicitly for the missing values.

- IF a case is classified `blocked_by_data`  
  THEN implement the real test body and gate it with dataset-based skip condition inside the test itself (for example via `test.skip(missingFields.length > 0, ...)`).

- IF user has not been asked for those exact missing values  
  THEN `test.skip(...)` is allowed only if placeholders were generated first and the missing values were requested in the report.

- IF user provides values  
  THEN write them to `tests/e2e/config/e2e.input.local.json` (unless user says not to) and implement runnable test.

- IF user was asked explicitly and did not provide values  
  THEN allow `test.skip(...)` only for the strictly blocked tests with explicit local path in message.

- IF a missing-data key is discovered during implementation or validation  
  THEN append placeholder keys immediately (do not defer to a later run).

### D. OTP/SCA
- IF deterministic OTP retrieval contract exists (including shared repo harness)  
  THEN automate OTP completion.

- IF OTP contract is shared at repository level  
  THEN treat as reusable capability, not story-specific blocker.

- IF deterministic OTP contract is unavailable/unstable/undocumented  
  THEN mark affected test as `test.skip(...)` with concrete reason.

### E. Navigation
- IF test is standard journey  
  THEN always start from real login (no downstream deep-link shortcuts).

- IF using `page.goto(...)`  
  THEN use basename-aware entry contract only.

- IF asserting route  
  THEN use basename-agnostic suffix (`expectUrlPath(...)` style).

- IF asserting forward navigation after submit/CTA  
  THEN never require `pathname.startsWith('/registration/...')` on raw pathname; use basename-safe contracts only (suffix helpers, `includes('/registration/')`, or equivalent normalized checks).

- IF navigation string is root-relative (e.g. `'/login'`) for `page.goto(...)`  
  THEN reject and fix.

### F. Assertions and locators
- IF test is pure bootstrap/reachability  
  THEN assert only: expected route + target control/container + anti-outcome route.

- IF test is functional (non copy-focused)  
  THEN assert minimum wording needed for control/state intent only.

- IF exact copy is not explicitly contractual  
  THEN use semantic-normalized comparison.

- IF requirement explicitly mandates literal formatting/casing/punctuation  
  THEN use literal-exact copy assertions.

- IF a functional assertion depends on short UI copy (validation labels, CTA labels, status fragments) and exact glyphs are not contractual  
  THEN generate resilient matchers that tolerate common locale typography variants (for example accented vs non-accented letters and straight vs typographic apostrophes), while keeping lexical intent unchanged.

- IF `TC-E2E-*` mixes behavior and exact-copy concerns  
  THEN split into behavior test + companion `COPY-*` test.

- IF acting on form fields  
  THEN resolve editable element (`input|textarea|select|[contenteditable=true]`) before `fill/clear/blur/inputValue/toHaveValue/placeholder`.

- IF locator resolves only to a wrapper and editable child cannot be resolved deterministically  
  THEN fail explicitly with precise locator error.

- IF action fallback could hit wrong control (`button.first/last`, generic page scan)  
  THEN forbidden.

- IF non-trivial fallback is used  
  THEN validate against runtime evidence (trace/video/screenshot/error-context) or report unresolved.

- IF the target is a critical container (for example header, stepper shell, modal shell)  
  THEN use a deterministic multi-candidate locator strategy with visibility resolution (not a single fragile CSS selector).

### G. Accessibility boundary
- IF selected cases include accessibility expectations  
  THEN exclude accessibility assertions from this skill and report handoff items.

- IF locator uses role/name only to perform a functional action  
  THEN allowed (selector mechanics, not accessibility testing).

### H. Failure diagnostics (mandatory)
- IF a critical assertion fails (route, visibility, control actionability, or branch outcome)  
  THEN emit an actionable error including:
  - contract name (what was expected)
  - current URL/path
  - control/container intent
  - timeout used when relevant

- IF locator resolution fails  
  THEN fail with explicit locator-resolution text (do not rely only on opaque default timeout output).

- IF using `expect.poll(...)`  
  THEN always provide a descriptive `message` so the report is self-explanatory.

- IF a text assertion fails and the expected contract is non-literal  
  THEN diagnostics must explicitly suggest checking normalization-sensitive variants before changing business intent.

---

## 3) Execution Pipeline (7 steps max)

### Step 1 — Read required artifacts
Read in order:
1. `tests/e2e/README.md`
2. selected `TC-E2E-*` in `test-cases.md`
3. mapped parent `TC-A-*`
4. related `requirements.md` sections
5. existing helpers in `tests/e2e/helpers/*`
6. adjacent scenario patterns (only for implementation style)
7. runtime bank profile in `tests/e2e/config/runtime/banks.js`

### Step 2 — Build the plan matrix
For each selected `TC-E2E-*`, map:
- preconditions
- journey path from login
- action
- expected outcome
- anti-outcome
- data needs
- blocker classification (if any)
- OTP handling
- copy scope class (journey-minimum / state-specific / exact-copy)

### Step 3 — Enforce data gate
Detect unresolved data keys and ask user in one grouped message with:
- exact local JSON path
- affected `TC-E2E-*`
- short business meaning example
- auto-generated placeholder keys written in `e2e.input.local.json`
- any `e2e.input.data.js` shape/env mapping added for those keys

Do not finalize without placeholder scaffolding for every unresolved `blocked_by_data` key.

### Step 4 — Implement exactly one scenario
- Create/update one `tests/e2e/scenarios/*.e2e.js`
- Keep basename-safe navigation and suffix assertions
- Keep selectors deterministic and intention-locked
- Keep flow logic in scenario file; do not create flow-specific helper modules
- For `blocked_by_data`, do not add unconditional `test.skip(...)` entries:
  - keep test body executable
  - add dataset precheck + conditional `test.skip(...)` at test start
- For critical route/control/container checks, add explicit diagnostic messages.
- For non-literal text contracts, prefer normalization-resilient regex/assertion patterns at generation time (avoid brittle single-glyph assumptions).

### Step 5 — Update local data only if needed
- Write business values/placeholders in `e2e.input.local.json`
- When missing data exists, always scaffold placeholders (e.g. `SET_*`) in `e2e.input.local.json`
- Mirror missing-data key shape in `e2e.input.data.js` when absent, and add env mapping only if the project pattern already supports it
- Never store runtime routes, selectors, contracts, expected copy in data files

### Step 6 — Validate
Run targeted scenario once when runnable.

IF failure occurs:
- inspect Playwright evidence first
- keep TC intent unchanged
- patch only with evidence-backed fixes

IF runtime cannot run:
- report concrete blocker
- still complete static contract review

### Step 7 — Return output contract
Return:
- scenario path
- implemented list
- skipped list with reasons
- local data updates/placeholders
- missing data requested (if pending)
- explicit placeholder inventory generated for `blocked_by_data` (file + key path)
- blocked-case classification outcomes
- copy assertion scope summary
- accessibility handoff exclusions

---

## 4) Exceptions

### Explicit non-goals (unless requested)
- analytics payload assertions
- accessibility audits/assertions
- pure visual assertions

### Allowed skips
- `blocked_by_others_info` with deterministic reason and owner
- `blocked_by_data` only as conditional skip at runtime when required dataset is unresolved (after placeholder scaffolding + explicit data request)
- OTP unavailable/unstable/undocumented

### Forbidden shortcuts
- skipping blocked browser cases without classification
- keeping missing-data skips without prior explicit data request
- hardcoding `blocked_by_data` cases as unconditional `test.skip(...)`
- using one fragile CSS selector as the only locator strategy for critical containers
- relying only on raw default timeout messages for critical failures
- using brittle single-variant text matchers for non-literal copy contracts
- deep-link bootstrap to downstream route
- raw-path assertions that depend on app root (for example `pathname.startsWith('/registration/')`) in basename-enabled apps
- permissive click fallbacks
- weakening assertions to match current frontend behavior

---

## Quick Self-Check
- [ ] Exactly one scenario file changed
- [ ] All selected `TC-E2E-*` implemented or explicitly skipped
- [ ] Every `blocked_by_dependency` browser case classified first
- [ ] Missing local data requested explicitly before any data-based skip
- [ ] Every unresolved `blocked_by_data` key has auto-generated placeholder entries in `e2e.input.local.json`
- [ ] `e2e.input.data.js` contains matching placeholder shape/env mapping when needed
- [ ] No missing-data skip exists without placeholder scaffolding + explicit missing-data request
- [ ] `blocked_by_data` tests are conditional (run when data exists, skip only when data is unresolved)
- [ ] Critical failures are reported with clear diagnostics (contract + URL/path + selector intent)
- [ ] Non-literal text assertions tolerate locale typography variants without weakening business intent
- [ ] Journey starts from login and keeps basename-safe contracts
- [ ] No route assertion relies on raw root-prefixed checks (for example `pathname.startsWith('/registration/')`) when basename may be present
- [ ] OTP automated when deterministic contract exists
- [ ] No accessibility-only assertions added
- [ ] Form interactions target editable element, not wrapper
- [ ] No permissive click fallback
- [ ] No unrelated files changed

---

## Templates
- Scenario skeleton: `templates/scenario.template.e2e.js`
- Local data skeleton: `templates/local-flow-data.template.json`
