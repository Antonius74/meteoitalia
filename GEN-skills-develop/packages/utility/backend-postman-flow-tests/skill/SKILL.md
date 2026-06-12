---
name: backend-postman-flow-tests
description: "Create backend Postman flow test environments and collections from repository testing documentation."
---

# Postman Temp Flow Tests

Use this skill to assemble a Postman environment and a Postman collection for a specific portal flow in this repository.
NEVER mutate long-lived Postman assets with this skill unless the user explicitly asks for that. Always create new assets for each flow test run.

## Workflow

1. Confirm the target flow and portal.
2. If the environment is not explicit, ask the user which environment to use before creating test assets.
3. Create a Postman environment for the selected environment and portal. Do not reuse or mutate a long-lived environment unless the user explicitly asks for that.
4. Create a Postman collection for the target flow. Keep it flow-oriented and clearly named.
5. Look at README.md and extract testing details, reusable Postman requests and environment configuration tips.  
6. Configure the copied request so its pre-request script selects the chosen environment and portal, using README.md and existing collection scripts as the source of truth.
7. Decide whether the requested flow starts already authenticated.
8. If the flow is not already authenticated, prepend every prerequisite request needed to reach the requested step.
9. If login is required, copy the login prerequisite requests from the existing collection in the order documented by README.md or demonstrated by the repository's existing collections.
10. Add the requested business-flow calls after the prerequisite sequence.
11. Add response scripts that persist every token or workflow value reused later.
12. Verify that each later request consumes the expected environment variables, especially the access token from `/prelogin/start-session` calls.

## Asset Rules

- Keep both the environment and the collection flow-specific.
- Use names that include flow, and environment.
- Put the environment bootstrap request first.
- Do not hard-code environment domains, tokens or OTP values.
- Prefer `pm.environment.set(...)` for new scripts unless the copied source request must preserve a legacy script exactly.

## Source Of Truth

Always thread README.md of current project as source of truth. Follow end-to-end testing documentation referenced in it.

## Login Decision

Read README.md of current project for details on how to understand if current flow is authenticated or not.
If such details is not present ask the user.

## Request Construction Rules

- Keep portal headers parameterized with environment variables.
- Use `{{environment_root}}` as the base URL.
- Use `Authorization: {{access_token}}` or another clearly named token variable when the request requires the access token.
- For requests copied from existing collections, preserve the original headers and only replace literals with variables when needed for portability.

## Logging
Add complete logging for each test run, including:
- The chosen environment and portal
- Request names, URLs, methods, headers, and body for every request in the collection
- Response status codes, headers, and bodies (in JSON format) for every response in the collection

## Token Propagation

### Rule

Responses can return the access token in one of these fields:

- `access_token`
- `clientAccessToken`
- `accessToken`

Extract whichever field is present and persist it for all following requests that need authorization.

### Standard Script

Use this response test script in the collection unless the copied source request already contains an equivalent script:

```javascript
const body = pm.response.json();
const rawToken =
  body.access_token ||
  body.clientAccessToken ||
  body.accessToken ||
  "";

if (rawToken) {
  const bearerToken = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;
  pm.environment.set("access_token_login", bearerToken);
}
```

### Consumption Rule

- Use `{{access_token}}` in later `Authorization` headers unless the flow already uses a more specific token variable name.
- If a flow keeps multiple tokens, store each one with a descriptive variable name and use the right one per request.
- Do not leave later authenticated requests wired to a stale hard-coded token.

## Output

Produce or update only the Postman assets needed for the requested test run. Keep the sequence easy to inspect, with prerequisites first and business-flow requests after them.
