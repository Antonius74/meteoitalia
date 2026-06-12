## Variant Overlay: Backend

This section does not replace the shared architecture template above.
Use the shared architecture template as the base instructions, then append the
backend architecture overlay below.

### Backend Architecture Overlay

- backend overlay: [`../workflow-core-kit/templates/skills/backend/architecture.template.md`](../workflow-core-kit/templates/skills/backend/architecture.template.md)

### Additional Backend Input Sources

- API producer contract: [`../workflow-core-kit/references/api-producer-contract.md`](../workflow-core-kit/references/api-producer-contract.md)
- API contract handoff template: [`../workflow-core-kit/templates/skills/shared/api-contract-template.md`](../workflow-core-kit/templates/skills/shared/api-contract-template.md)

For backend architecture work, additional supporting source material may also include
API integration artifacts when they are explicitly provided and relevant.
Swagger/OpenAPI files are one supported source. Use the producer contract for
backend-owned API creation, compatibility, implementation scope, and traceability
back to impacted requirements.

### Backend API Contract Handoff

When running the backend variant, initialize architecture artifacts with
`--include-api-contract` so the run creates both `implementation-plan.md` and
`api-contract.md`.

Write the API handoff to `artifacts.api_contract` from
`<run_dir>/workflow-state.yml`. The file must be usable by frontend,
mobile-android, and mobile-ios architecture runs without requiring them to read
backend source code.

Include:

- endpoint operations, methods, paths, parameters, headers, authentication, and authorization
- request and response schemas with required/optional fields, nullability, defaults, and validation rules
- status code and error-shape mapping, including degraded dependency behavior
- compatibility, versioning, rollout, migration, and deprecation notes
- consumer implementation notes for frontend, Android, and iOS where behavior differs
- traceability from every API-impacting `REQ-xxx` to operation, schema, or contract source

If no requirement changes backend API behavior, keep the artifact and write
`No API-impacting changes identified` in the summary rather than omitting the
file.
