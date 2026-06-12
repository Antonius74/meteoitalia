# Implementation Plan

> **Generated:** 2026-04-10
> **Based on:** requirements.md
> **Total Steps:** 6

---

## Overview

Implement user registration and JWT-based authentication. Adds a user data model,
a data-access object, input/output schemas, business logic service, an entry-point
module (handler, screen, or command — depending on project type), and a session
validation guard.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Password hashing | BCrypt (cost ≥ 12) | Industry standard, resistant to brute-force |
| Token format | JWT signed with HS256 | Stateless, no server-side session store needed |
| Validation | Declarative on input schema | DRY, enforced at the boundary before reaching business logic |

---

## Implementation Steps

### Step 1: User Data Model
- **Requirement:** REQ-001
- **Action:** CREATE
- **File:** `src/<module>/domain/user.<ext>`
- **Responsibility:** Represents a persisted user record; pure data holder with no behaviour.
- **Public interface:**
  - `User` type/class with fields: `id` (unique identifier), `email` (string), `password_hash` (string), `created_at` (timestamp)
- **Internal logic:** None — field definitions only.
- **Dependencies:** None.
- **Error cases:** None.
- **Constraints:** `email` and `password_hash` must not be nullable.

---

### Step 2: User Repository
- **Requirement:** REQ-001, REQ-003
- **Action:** CREATE
- **File:** `src/<module>/repository/user_repository.<ext>`
- **Responsibility:** Abstracts all read/write access to the user data store; no business logic.
- **Public interface:**
  - `find_by_email(email: string) → User | None` — returns the user with the given email, or None if not found
  - `exists_by_email(email: string) → bool` — returns true if any user record has this email
  - `save(user: User) → User` — persists a new user record and returns it with its generated ID
- **Internal logic:** Delegates to the ORM or query builder already used in the project. No logic beyond translating calls to persistence operations.
- **Dependencies:** imports the data-store client or ORM already configured in the project.
- **Error cases:** propagates storage-level errors unchanged; does not catch or wrap them.
- **Constraints:** follows the repository naming convention of existing repositories in the project.

---

### Step 3: Input / Output Schemas
- **Requirement:** REQ-001, REQ-002, REQ-003
- **Action:** CREATE
- **Files:**
  - `src/<module>/schemas/register_input.<ext>` — input schema for registration
  - `src/<module>/schemas/register_output.<ext>` — output schema for registration
  - `src/<module>/schemas/login_input.<ext>` — input schema for login
  - `src/<module>/schemas/login_output.<ext>` — output schema for login
- **Responsibility:** Define and enforce the shape and constraints of data crossing the module boundary.
- **Public interface:**
  - `RegisterInput`: fields `email` (required, valid email format), `password` (required, min 8 chars, must contain upper, lower, and digit)
  - `RegisterOutput`: fields `id`, `email`
  - `LoginInput`: fields `email` (required), `password` (required)
  - `LoginOutput`: field `token` (string)
- **Internal logic:** Use the project's standard validation mechanism; raise a validation error with a descriptive message on constraint violation.
- **Dependencies:** project's validation library (already in use).
- **Error cases:** raises `ValidationError` with field-level messages when any constraint is violated.
- **Constraints:** schema types must be immutable / value objects where the project convention supports it.

---

### Step 4: Auth Service
- **Requirement:** REQ-001, REQ-002, REQ-003
- **Action:** CREATE
- **File:** `src/<module>/service/auth_service.<ext>`
- **Responsibility:** Encapsulates all authentication business logic; orchestrates the repository and cryptographic utilities.
- **Public interface:**
  - `register(input: RegisterInput) → RegisterOutput` — registers a new user
  - `login(input: LoginInput) → LoginOutput` — authenticates a user and issues a token
- **Internal logic:**
  - `register`: call `exists_by_email(input.email)`; if true, raise `DuplicateEmailError`; hash `input.password` with bcrypt (cost ≥ 12); call `save(user)`; return `RegisterOutput(id, email)`
  - `login`: call `find_by_email(input.email)`; if None, raise `InvalidCredentialsError`; verify `input.password` against stored hash; if mismatch, raise `InvalidCredentialsError`; issue a signed JWT with claims `sub`, `email`, `iat`, `exp`; return `LoginOutput(token)`
- **Dependencies:** `UserRepository` (injected), password hashing library, JWT signing library.
- **Error cases:**
  - `DuplicateEmailError` — raised when `exists_by_email` returns true during registration
  - `InvalidCredentialsError` — raised when user not found or password does not match during login
- **Constraints:** must never expose whether the email exists during a failed login (always raise the same `InvalidCredentialsError` regardless of cause).

---

### Step 5: Auth Entry Point
- **Requirement:** REQ-001, REQ-003
- **Action:** CREATE
- **File:** `src/<module>/entrypoint/auth_entrypoint.<ext>`
- **Responsibility:** Receives incoming requests (HTTP handler, UI screen action, CLI command — whichever the project uses), validates input, delegates to `AuthService`, and returns the output.
- **Public interface:** Follows the entry-point convention of the project (e.g. route handler functions, screen event handlers, command functions). Exposes `register` and `login` operations.
- **Internal logic:**
  1. Parse and validate the incoming input using the appropriate input schema
  2. Call the corresponding `AuthService` method
  3. Map the service output to the project's response/presentation format
  4. Map `DuplicateEmailError` to the project's conflict-response convention
  5. Map `InvalidCredentialsError` to the project's unauthorised-response convention
- **Dependencies:** `AuthService` (injected), input schema validators.
- **Error cases:** converts domain errors to the appropriate output format; does not let raw exceptions reach the caller.
- **Constraints:** contains no business logic; all rules live in `AuthService`.

---

### Step 6: Auth Guard / Session Validator
- **Requirement:** REQ-004
- **Action:** CREATE
- **File:** `src/<module>/guard/auth_guard.<ext>`
- **Responsibility:** Intercepts requests to protected operations and rejects those without a valid session token.
- **Public interface:** follows the project's existing guard, middleware, or interceptor interface.
- **Internal logic:**
  1. Extract the token from the request context (header, cookie, local storage — follow project convention)
  2. If absent or empty, reject immediately with the project's unauthorised response
  3. Validate token signature and expiry using the JWT library
  4. If invalid or expired, reject with the project's unauthorised response
  5. If valid, set the authenticated identity in the request context and allow the call to proceed
- **Dependencies:** JWT validation library; request-context accessor following project conventions.
- **Error cases:** any token error (missing, invalid, expired) results in rejection; errors are never propagated as exceptions to the caller.
- **Constraints:** applied only to protected operations; the register and login entry points must remain accessible without a token.

---

## Configuration Changes

| Key | Value / Source | Purpose |
|-----|----------------|---------|
| `JWT_SECRET` | Environment variable | Signing key for JWT — must not be hard-coded |
| `JWT_EXPIRY_SECONDS` | `86400` (24 h default) | Token lifetime |

---

## Dependency Changes

| Package | Purpose |
|---------|---------|
| JWT signing library (project's standard or nearest equivalent) | Issue and verify JWT tokens |
| Password hashing library (project's standard or nearest equivalent) | BCrypt hashing |

---

## Risks & Assumptions

> This table was reviewed with the rest of the design artifacts at Gate 2.

| # | Risk or Assumption | Impact if Wrong | Mitigation | Status |
|---|-------------------|-----------------|------------|--------|
| R-01 | `JWT_SECRET` is always present in the environment | Auth module fails to start with a cryptic error | App startup must validate its presence and fail fast with a clear message | Approved at Gate 2 on 2026-04-10 |
| R-02 | No token refresh is in scope for this iteration | Users must re-authenticate after token expiry | Confirmed with product; refresh tokens are deferred to next sprint | Approved at Gate 2 on 2026-04-10 |
| R-03 | The project already has a password hashing library available | Additional dependency must be added | If not already present, add bcrypt library via package manager | Approved at Gate 2 on 2026-04-10 |

**Gate 2 decision:** Approved by @matteo on 2026-04-10. R-02 explicitly deferred.

---

## Traceability Matrix

| Requirement | Title | Steps |
|------------|-------|-------|
| REQ-001 | User Registration | 1, 2, 3, 4, 5 |
| REQ-002 | Password Validation Rules | 3, 4 |
| REQ-003 | Login | 2, 3, 4, 5 |
| REQ-004 | Session Validation Guard | 6 |
