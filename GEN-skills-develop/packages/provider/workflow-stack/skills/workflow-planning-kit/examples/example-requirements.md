# Requirements Document

> **Generated:** 2026-04-10
> **Source Issues:** PROJ-101, PROJ-102
> **Total Requirements:** 4

---

## Source Jira Issues

| Key | Title | Status |
|-----|-------|--------|
| PROJ-101 | User can register with email and password | In Progress |
| PROJ-102 | Registered user can log in and receive a JWT | To Do |

---

## Functional Requirements

### Authentication

#### REQ-001: User Registration Endpoint

- **Source:** PROJ-101
- **Priority:** High
- **Description:** The system must expose a `POST /api/v1/auth/register` endpoint
  that accepts an email and password, validates them, creates a User entity, and
  returns a 201 response with the created user's ID and email.
- **Acceptance Criteria:**
  - Email must be unique; duplicate email returns 409 Conflict
  - Password must be ≥ 8 chars, contain upper, lower, digit
  - Password stored as bcrypt hash (cost ≥ 12)
  - Response body: `{ "id": <Long>, "email": "<string>" }`
- **User Inputs:**
  - `email`: string, required
  - `password`: string, required
- **Validations:**
  - `email` must be unique; duplicate returns 409 Conflict
  - `password` must be at least 8 characters and contain upper, lower, and digit
- **Displayed Data:**
  - Response includes created `id` and `email`
- **User Flow / Next Steps:**
  - Successful registration returns 201 and allows later login
- **Jira Original Text:**
  > As a new user I want to register with my email and password so that I can
  > log in later.

#### REQ-002: Password Validation Rules

- **Source:** PROJ-101
- **Priority:** High
- **Description:** Passwords failing validation return 422 with a field-level
  error message indicating which rule was violated.
- **Acceptance Criteria:**
  - Returns 422 for blank password
  - Returns 422 for password shorter than 8 characters
  - Error body: `{ "field": "password", "message": "..." }`
- **User Inputs:**
  - `password`: string, required
- **Validations:**
  - Blank or too-short password returns 422 with field-level error details
- **Displayed Data:**
  - Error body includes `field` and `message`
- **User Flow / Next Steps:**
  - Request is rejected; user can correct the password and retry

#### REQ-003: Login Endpoint

- **Source:** PROJ-102
- **Priority:** High
- **Description:** `POST /api/v1/auth/login` accepts email + password, validates
  credentials, and returns a signed JWT valid for 24 h.
- **Acceptance Criteria:**
  - Returns 200 with `{ "token": "<JWT>" }` on success
  - Returns 401 for invalid credentials
  - JWT contains claims: `sub` (user ID), `email`, `iat`, `exp`
- **User Inputs:**
  - `email`: string, required
  - `password`: string, required
- **Validations:**
  - Invalid credentials return 401
- **Displayed Data:**
  - Response includes signed JWT token on success
- **User Flow / Next Steps:**
  - Token is used as Bearer authentication for protected endpoints

#### REQ-004: JWT Verification Middleware

- **Source:** PROJ-102
- **Priority:** High
- **Description:** All non-auth endpoints must require a valid Bearer JWT.
  Requests without or with an invalid token return 401.
- **Acceptance Criteria:**
  - Missing Bearer token returns 401
  - Invalid Bearer token returns 401
- **User Inputs:**
  - `Authorization` header with Bearer JWT
- **Validations:**
  - Token signature and expiration must be valid
- **Displayed Data:**
  - Unauthorized requests return 401 response
- **User Flow / Next Steps:**
  - Valid requests continue to protected endpoint handling

---

## Non-Functional Requirements

#### REQ-NFR-001: Registration Latency

- **Category:** Performance
- **Source:** PROJ-101 (implicit)
- **Description:** Registration endpoint p99 latency must be < 500 ms under
  normal load (≤ 100 rps).

---

## Assumptions

| # | Assumption | Impact if Wrong |
|---|-----------|-----------------|
| A-01 | JWT secret is provided via env var `JWT_SECRET` | Auth will not start |
| A-02 | PostgreSQL is the target database | Migration SQL may differ |

---

## Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| Q-01 | Should refresh tokens be supported in this iteration? | Product | 2026-04-15 |

---

## Traceability Matrix

| Requirement | Jira Key | Priority | Status |
|------------|----------|----------|--------|
| REQ-001    | PROJ-101 | High     | Draft  |
| REQ-002    | PROJ-101 | High     | Draft  |
| REQ-003    | PROJ-102 | High     | Draft  |
| REQ-004    | PROJ-102 | High     | Draft  |
| REQ-NFR-001| PROJ-101 | Medium   | Draft  |
