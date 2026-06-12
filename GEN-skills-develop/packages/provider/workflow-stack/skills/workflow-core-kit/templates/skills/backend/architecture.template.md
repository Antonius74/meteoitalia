# Backend Overlay: Architecture

Apply this overlay after the shared architecture template.

- Include service boundaries and dependency direction across controllers, services, adapters, and repositories.
- Apply `references/api-producer-contract.md` when planning backend-owned API creation or contract changes.
- Write `artifacts.api_contract` when backend API behavior is created, changed, removed, or confirmed unchanged for the run.
- Define error category mapping from domain failures to API responses.
- Specify data consistency and transaction boundaries where state changes occur.
- If there are no API-impacting backend changes, keep the API handoff artifact and mark it `No API-impacting changes identified`.
