# Backend Overlay: Test Design

Apply this overlay after the shared test-design template.

- Ensure each requirement has API-level automated coverage with status/error assertions.
- Apply `references/api-producer-contract.md` for producer-side API validation, compatibility, and negative cases.
- Include service/domain behavior cases through public interfaces, using doubles only for true system boundaries such as external services, persistence, time, or messaging.
- Add negative tests for authorization, malformed payloads, and missing resources.
