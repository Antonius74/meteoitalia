# Backend Overlay: Development

Apply this overlay after the shared development template.

- Keep endpoint layers thin and delegate business behavior to service/domain units.
- Apply `references/api-producer-contract.md` for backend-owned API implementation details.
- When `artifacts.api_contract` exists, verify implemented routes, request/response schemas, status/error mapping, compatibility, and versioning against that handoff.
- Add integration-safe validation before outbound dependencies and keep boundary doubles aligned with the `TC-U-xxx` cases.
- Preserve backward compatibility for existing API contracts unless explicitly versioned.
