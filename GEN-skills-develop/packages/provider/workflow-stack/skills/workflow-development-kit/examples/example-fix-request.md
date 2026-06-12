# Example Fix Request

This is the format the Unit-Tester or Automation-Test-Runner sends to the Developer
when a test fails. The Developer reads this, locates the issue, applies a minimal
fix, confirms the build is clean, and reports back.

---

## Fix Request: TC-U-003

- **Test file:** `tests/auth/test_auth_service.py`
- **Test name:** `test_register_duplicate_email_raises_conflict`
- **Failure:** `DuplicateEmailError` was not raised — `DatabaseConstraintError` propagated instead.
- **Expected:** The registration service checks for a duplicate email before
  attempting to persist the record, and raises a domain-specific `DuplicateEmailError`
  with a user-friendly message when a duplicate is detected.
- **Actual:** The uniqueness check is not performed in the service layer; the raw
  database constraint violation propagates to the API handler, which returns 500
  instead of the expected 409 Conflict.
- **Raw output:**
  ```
  FAILED tests/auth/test_auth_service.py::test_register_duplicate_email_raises_conflict
  
  auth/test_auth_service.py:42 in test_register_duplicate_email_raises_conflict
      with pytest.raises(DuplicateEmailError):
  E   Failed: DID NOT RAISE <class 'app.domain.errors.DuplicateEmailError'>
  
  During handling of the above exception, another exception occurred:
  
      DatabaseConstraintError: duplicate key value violates unique constraint "users_email_key"
      DETAIL: Key (email)=(test@example.com) already exists.
  
  ============================== 1 failed in 0.34s ==============================
  ```
- **Likely cause:** The service calls `save()` without first calling `exists_by_email()`,
  so the uniqueness constraint is enforced only at the database level.
- **Suggested fix:** In the registration service, before persisting the record,
  call `exists_by_email(email)`. If it returns true, raise `DuplicateEmailError`
  immediately. This keeps the domain error in the service layer and prevents the
  raw database error from reaching the handler.
- **Requirement:** REQ-001
