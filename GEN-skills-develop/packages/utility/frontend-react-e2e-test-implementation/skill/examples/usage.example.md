# Usage Example

## Input
- `test-cases.md`: `.workflows/MPSC-33_Registrazione-Welcome/test-cases.md`
- Selected cases:
  - `TC-E2E-001`
  - `TC-E2E-002`
  - `TC-E2E-003`
  - `TC-E2E-004`
  - `TC-E2E-005`
  - `TC-E2E-006`
  - `TC-E2E-007`
  - `TC-E2E-008`
  - `TC-E2E-009`
- Output scenario: `tests/e2e/scenarios/registration-welcome.mpsc-33.e2e.js`

## Expected Output
1. One scenario file created/updated with one Playwright test block per `TC-E2E-*`
2. Optional local data update only in `tests/e2e/config/e2e.input.local.json` when extra data is strictly required
3. Optional `tests/e2e/config/e2e.input.data.js` update only for placeholder defaults/env mapping
4. Dataset placeholders (`SET_*`) resolved as deterministic `test.skip(...)` per case

## Non-goals
- No changes to `scripts/test-e2e.js`, reporters, or global Playwright configuration
- No hardcoded absolute URL with origin/basename
- No duplication of login credentials outside `auth.primary`
