# Backend Variant: Controller or Endpoint Implementation

This template extends shared development guidance with backend entry-point rules.

## Rules
- Keep controllers or handlers thin and orchestration-only.
- Delegate business logic to domain or service layers.
- Validate request shape and authorization early.
- Map internal exceptions to stable API-level errors.
- Emit request-scoped observability signals.

## Typical Checks
- request or response schema compliance
- status code and error payload consistency
- auth and permission coverage
