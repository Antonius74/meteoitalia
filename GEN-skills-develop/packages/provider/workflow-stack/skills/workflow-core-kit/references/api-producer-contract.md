# API Producer Contract

Use this reference when the current repository owns API creation or changes the
server-side contract exposed to other systems.

## Scope

API producer work includes:

- defining or changing routes, operations, request payloads, response payloads,
  status codes, headers, authentication, authorization, and versioning
- implementing controller, handler, service, domain, persistence, or outbound
  integration logic needed to satisfy the contract
- enforcing validation, error mapping, idempotency, retries, observability, and
  compatibility rules at the API boundary
- preserving or explicitly versioning existing consumer-facing behavior

## Planning Rules

- Treat OpenAPI, Swagger, AsyncAPI, GraphQL schema, or equivalent contracts as
  supporting evidence when explicitly provided.
- Extract only declared behavior: paths, operations, parameters, schemas,
  examples, status codes, auth rules, validation constraints, and error shapes.
- Preserve traceability from each requirement to the source issue and the
  contract location, such as operation ID, path, schema, or component name.
- Record conflicts between Jira, design material, repository docs, and API
  contracts in Open Questions.
- File functional-requirement.md is a supported additional source for 
  backend requirements.

## Architecture Rules

- Map every API contract change to concrete implementation files in the
  repository's existing layers.
- Specify compatibility impact for existing consumers.
- Define validation, error mapping, transaction boundaries, observability, and
  migration sequencing where they affect behavior.
- Avoid inventing new API behavior that is not present in approved requirements
  or explicitly provided supporting source material.

## Development And Test Rules

- Keep endpoint or transport layers thin where the repository already separates
  handlers/controllers from business behavior.
- Drive implementation through public API or service interfaces named in
  `TC-U-xxx` behavior cases.
- Include negative coverage for malformed payloads, missing resources,
  authorization failures, conflict/idempotency cases, and degraded dependencies.
- Treat acceptance flows as executable only when required services, data, and
  credentials are available; otherwise record substitute evidence and risk.
