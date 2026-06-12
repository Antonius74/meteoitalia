# Test Cases

> **Generated:** 2026-04-10
> **Based on:** requirements.md

---

## Suite Execution Strategy

- **Strategy:** `mixed`
- **Required services:** backend API, test database, auth token issuer
- **Environment readiness:** `partially ready`
- **Notes:** registration and login API flows are automated; protected-resource browser validation is manual until the frontend route is deployed.

---

## Unit / Behavior Test Backlog

Use these `TC-U-xxx` cases as the development backlog. The Developer implements
one unit/behavior case at a time with red-green-refactor.

### TC-U-001: Register with valid input - creates retrievable user
- **Requirement:** REQ-001
- **Priority:** `P0`
- **Development order:** 1
- **Depends on:** `none`
- **Public interface / entry point:** `AuthService.register()`
- **Observable behavior:** a valid registration returns a new user identifier and the user can be retrieved through the public user lookup interface
- **Preconditions / state:** email does not already exist
- **Input / action:** valid email and password meeting all validation rules
- **Expected result:** registration succeeds and `getUser(newUserId)` returns the registered email
- **Boundary doubles:** persistence test double or test database
- **Notes:** do not assert internal repository calls

### TC-U-002: Register with duplicate email - rejects conflict
- **Requirement:** REQ-001
- **Priority:** `P0`
- **Development order:** 2
- **Depends on:** `TC-U-001`
- **Public interface / entry point:** `AuthService.register()`
- **Observable behavior:** duplicate registration is rejected through the public error contract
- **Preconditions / state:** an account already exists for the same email
- **Input / action:** same email as the existing account and any valid password
- **Expected result:** duplicate-email error is returned or raised
- **Boundary doubles:** persistence test double or test database
- **Notes:** email comparison is case-insensitive

### TC-U-003: Register with weak password - rejects validation
- **Requirement:** REQ-002
- **Priority:** `P1`
- **Development order:** 3
- **Depends on:** `none`
- **Public interface / entry point:** `AuthService.register()`
- **Observable behavior:** weak password is rejected before account creation
- **Preconditions / state:** email is not registered
- **Input / action:** valid email and password that does not meet strength rules
- **Expected result:** validation error identifies the password field
- **Boundary doubles:** none
- **Notes:** include shortest invalid password and missing required character class

### TC-U-004: Login with correct credentials - returns session token
- **Requirement:** REQ-003
- **Priority:** `P0`
- **Development order:** 4
- **Depends on:** `TC-U-001`
- **Public interface / entry point:** `AuthService.login()`
- **Observable behavior:** valid credentials create a usable session token
- **Preconditions / state:** active user account exists with matching password
- **Input / action:** correct email and password
- **Expected result:** non-empty token is returned and accepted by the public session validation interface
- **Boundary doubles:** clock/token signer boundary if needed
- **Notes:** do not assert private token-generation methods

### TC-U-005: Login with wrong password - rejects credentials
- **Requirement:** REQ-003
- **Priority:** `P1`
- **Development order:** 5
- **Depends on:** `TC-U-004`
- **Public interface / entry point:** `AuthService.login()`
- **Observable behavior:** invalid credentials are rejected without creating a session
- **Preconditions / state:** active user account exists
- **Input / action:** correct email and wrong password
- **Expected result:** invalid-credentials error is returned or raised
- **Boundary doubles:** clock/token signer boundary if needed
- **Notes:** response must not reveal whether the email exists

### TC-U-006: Protected profile without session - rejects access
- **Requirement:** REQ-004
- **Priority:** `P0`
- **Development order:** 6
- **Depends on:** `TC-U-004`
- **Public interface / entry point:** `SessionGuard.authorize()`
- **Observable behavior:** unauthenticated callers cannot access protected profile behavior
- **Preconditions / state:** no active session token is available
- **Input / action:** attempt to authorize access to the profile capability
- **Expected result:** unauthenticated result is returned and protected profile data is not exposed
- **Boundary doubles:** none
- **Notes:** do not assert route implementation details

### TC-U-007: Password reset request - sends reset notification command
- **Requirement:** REQ-005
- **Priority:** `P1`
- **Development order:** 7
- **Depends on:** `TC-U-001`
- **Public interface / entry point:** `PasswordResetService.requestReset()`
- **Observable behavior:** a valid reset request creates a reset token and sends a notification through the email boundary
- **Preconditions / state:** active user account exists for the requested email
- **Input / action:** request password reset for the registered email
- **Expected result:** reset request is accepted and the email boundary receives a reset-link command
- **Boundary doubles:** email provider boundary and clock/token signer boundary if needed
- **Notes:** do not require the external email sandbox for the behavior test

---

## End-to-End Test Backlog

Use these `TC-E2E-xxx` cases after development as automated end-to-end
validation, or as blocked-flow tracking when dependencies are unavailable.

### TC-E2E-001: Register with valid data - API success
- **Requirement:** REQ-001
- **Execution mode:** `fully_automated`
- **Automation channel:** `api_e2e`
- **Required services:** backend API, test database
- **Can run now:** `yes`
- **If blocked:** n/a
- **Action / Request / Flow:** `POST /api/v1/auth/register` with a valid email and password
- **Preconditions:** the email used is not already registered in the environment
- **Test data:**
  - 1 user account: none pre-existing; the test creates the account
  - Input payload: any email not present in the environment plus a password satisfying REQ-002 rules
- **Expected outcome:** HTTP 201; response contains the new user ID and email address used
- **Assertions:** status 201; `id` field is a valid identifier; `email` matches the input
- **Evidence to capture:** API test report and application logs
- **Log assertion:** no unexpected ERROR entries

### TC-E2E-002: Register with duplicate email - API conflict
- **Requirement:** REQ-001
- **Execution mode:** `fully_automated`
- **Automation channel:** `api_e2e`
- **Required services:** backend API, seeded account
- **Can run now:** `yes`
- **If blocked:** n/a
- **Action / Request / Flow:** `POST /api/v1/auth/register` using an email that is already registered
- **Preconditions:** TC-E2E-001 has run or an account with the target email already exists
- **Test data:**
  - 1 pre-existing user account with a known email
  - Input payload: same email as the pre-existing account
- **Expected outcome:** HTTP 409; error body indicates duplicate email
- **Assertions:** status 409
- **Evidence to capture:** API test report and application logs
- **Log assertion:** no unexpected ERROR entries; conflict is handled gracefully

### TC-E2E-003: Login with correct credentials - API returns token
- **Requirement:** REQ-003
- **Execution mode:** `fully_automated`
- **Automation channel:** `api_e2e`
- **Required services:** backend API, seeded account, auth token issuer
- **Can run now:** `yes`
- **If blocked:** n/a
- **Action / Request / Flow:** `POST /api/v1/auth/login` with valid credentials
- **Preconditions:** a registered account exists for the email used
- **Test data:**
  - 1 user account: registered, active, no special status required
  - Credentials: email and plain-text password for the account
- **Expected outcome:** HTTP 200; response contains a non-empty session token
- **Assertions:** status 200; `token` field is a non-empty string; token works for a protected endpoint
- **Evidence to capture:** API test report and application logs
- **Log assertion:** no unexpected ERROR entries

### TC-E2E-004: Access protected profile without token - UI rejection
- **Requirement:** REQ-004
- **Execution mode:** `blocked_by_dependency`
- **Automation channel:** `browser_e2e`
- **Required services:** frontend app, backend API
- **Can run now:** `no`
- **If blocked:** frontend route is not deployed; substitute evidence is the manual `TC-M-004` result plus `TC-U-006`
- **Action / Request / Flow:** open `/profile` in a browser without an authenticated session
- **Preconditions:** browser storage has no active auth token
- **Test data:** none required
- **Expected outcome:** user is redirected to login or shown the unauthenticated state
- **Assertions:** protected profile data is not visible
- **Evidence to capture:** screenshot of redirected/login state
- **Log assertion:** no unexpected ERROR entries

### TC-E2E-005: Password reset email - external email dependency unavailable
- **Requirement:** REQ-005
- **Execution mode:** `blocked_by_dependency`
- **Automation channel:** `api_e2e`
- **Required services:** backend API, email provider sandbox
- **Can run now:** `no`
- **If blocked:** email provider sandbox is not provisioned; substitute evidence is a boundary contract test for the email client request payload
- **Action / Request / Flow:** request password reset for an existing account
- **Preconditions:** active account exists
- **Test data:** existing user email
- **Expected outcome:** reset email is sent with a valid link
- **Assertions:** deferred until email sandbox is available
- **Evidence to capture:** blocker ticket and email-client contract test output
- **Log assertion:** deferred

---

## Manual Test Backlog

Use these `TC-M-xxx` cases for tester handoff, exploratory confirmation,
business sign-off, device/browser checks, or high-level manual validation when
automation is not enough.

### TC-M-001: Register with valid data - manual API smoke
- **Requirement:** REQ-001
- **Scope:** manual API smoke
- **Tester prerequisites:** backend API running with access to test database
- **Test data:** new email address and valid password
- **Steps:**
  1. Submit a registration request with valid data.
  2. Confirm the response status and body.
  3. Confirm the created user can be retrieved through the public lookup path.
- **Expected result:** account is created and retrievable
- **Evidence to capture:** API client screenshot or exported request/response
- **Blocked by:** `none`

### TC-M-002: Register with duplicate email - manual conflict check
- **Requirement:** REQ-001
- **Scope:** manual negative API smoke
- **Tester prerequisites:** seeded account with known email
- **Test data:** duplicate email and valid password
- **Steps:**
  1. Submit a registration request using the duplicate email.
  2. Confirm the response status and error body.
- **Expected result:** duplicate email is rejected without creating another account
- **Evidence to capture:** API client screenshot or exported request/response
- **Blocked by:** `none`

### TC-M-003: Login with valid credentials - manual API smoke
- **Requirement:** REQ-003
- **Scope:** manual login smoke
- **Tester prerequisites:** active test account
- **Test data:** valid account credentials
- **Steps:**
  1. Submit a login request with valid credentials.
  2. Confirm a non-empty token is returned.
  3. Use the token against a protected endpoint.
- **Expected result:** login succeeds and token authorizes protected access
- **Evidence to capture:** API client screenshot or exported request/response
- **Blocked by:** `none`

### TC-M-004: Access protected profile without token - manual UI check
- **Requirement:** REQ-004
- **Scope:** browser manual validation
- **Tester prerequisites:** frontend app and backend API are running
- **Test data:** none
- **Steps:**
  1. Open a fresh browser session.
  2. Navigate to `/profile`.
  3. Confirm no authenticated session exists in browser storage.
- **Expected result:** login or unauthenticated state appears; profile data is not visible
- **Evidence to capture:** screenshot of final state
- **Blocked by:** `none`

### TC-M-005: Password reset email - manual high-level validation
- **Requirement:** REQ-005
- **Scope:** manual high-level validation of reset request and email delivery
- **Tester prerequisites:** email provider sandbox provisioned
- **Test data:** active user email
- **Steps:**
  1. Request password reset for the active user.
  2. Check the email sandbox inbox.
  3. Open the reset link.
- **Expected result:** reset email is delivered with a usable link
- **Evidence to capture:** sandbox email screenshot and reset page screenshot
- **Blocked by:** `email provider sandbox`

---

## Automated Execution Queue

- `TC-E2E-001`
- `TC-E2E-002`
- `TC-E2E-003`

---

## Manual Test Handoff

### TC-M-004: Access protected profile without token - UI rejection
- **Tester prerequisites:** frontend app and backend API are running
- **Test data:** none
- **Steps:**
  1. Open a fresh browser session.
  2. Navigate to `/profile`.
  3. Confirm no authenticated session exists in browser storage.
- **Expected result:** login or unauthenticated state appears; profile data is not visible
- **Evidence to capture:** screenshot of final state

---

## Blocked Acceptance Flows

### TC-E2E-004: Access protected profile without token - UI rejection
- **Missing dependency:** deployed frontend route
- **Owner/team needed to unblock:** frontend/platform
- **Substitute validation evidence:** `TC-M-004` screenshot and `TC-U-006` behavior test output
- **Risk if left unexecuted:** browser route behavior is not validated in automation

### TC-E2E-005: Password reset email - external email dependency unavailable
- **Missing dependency:** email provider sandbox
- **Owner/team needed to unblock:** platform/infrastructure
- **Substitute validation evidence:** email-client contract test output
- **Risk if left unexecuted:** reset-link delivery cannot be validated end to end

### TC-M-005: Password reset email - manual high-level validation
- **Missing dependency:** email provider sandbox
- **Owner/team needed to unblock:** platform/infrastructure
- **Substitute validation evidence:** email-client contract test output
- **Risk if left unexecuted:** human confirmation of received email cannot be completed

---

## Development-Discovered Test Cases

No development-discovered cases yet.

---

## Traceability Matrix

| Requirement | Title | Unit / Behavior Cases | End-to-End Flows | Manual Cases |
|------------|-------|-----------------------|------------------|--------------|
| REQ-001 | User Registration | TC-U-001, TC-U-002 | TC-E2E-001, TC-E2E-002 | TC-M-001, TC-M-002 |
| REQ-002 | Password Validation Rules | TC-U-003 | TC-E2E-001 | TC-M-001 |
| REQ-003 | Login | TC-U-004, TC-U-005 | TC-E2E-003 | TC-M-003 |
| REQ-004 | Auth Guard / Session Validation | TC-U-006 | TC-E2E-004 | TC-M-004 |
| REQ-005 | Password Reset Email | TC-U-007 | TC-E2E-005 | TC-M-005 |
