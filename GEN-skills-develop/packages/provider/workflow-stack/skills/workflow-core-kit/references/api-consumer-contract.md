# API Consumer Contract

Use this reference when the current repository consumes an API owned by another
service or platform boundary.

## Scope

API consumer work includes:

- mapping external API contracts into local client modules, adapters, services,
  state, or UI flows
- serializing requests and parsing responses without leaking transport details
  into unrelated layers
- handling loading, empty, success, error, retry, cancellation, and degraded
  dependency states
- keeping consumer behavior stable when backend services, devices, or network
  dependencies are unavailable

## Planning Rules

- Treat OpenAPI, Swagger, GraphQL schema, backend contracts, mocks, examples, or
  integration notes as supporting evidence when explicitly provided.
- Capture required endpoints, request fields, response fields, status/error
  shapes, authentication expectations, environment dependencies, and fallback
  behavior.
- Preserve traceability from each requirement to the source issue and the
  contract location, such as operation ID, path, schema, or component name.
- Record gaps or conflicts between API contracts, Jira, design material, and
  repository documentation in Open Questions.

## Architecture Rules

- Keep transport concerns isolated in the repository's existing client, adapter,
  service, repository, or state-management boundaries.
- Define how API data maps to local domain, view, screen, or component state.
- Specify error normalization, retry/cancellation behavior, caching, and
  degraded-mode behavior where user-visible behavior depends on them.
- Avoid introducing backend-owned contract changes from a consumer repository;
  raise those as dependencies or Open Questions.

## Development And Test Rules

- Implement API consumption through stable public client or adapter interfaces.
- Use doubles only for true system boundaries such as remote APIs, time,
  filesystem, devices, auth providers, or costly infrastructure.
- Cover success, parsing, validation, authorization failure, unavailable
  dependency, timeout, retry, and cancellation states where they are observable.
- Mark acceptance flows blocked when required backend services, seeded data,
  credentials, devices, or third-party dependencies are unavailable.
