# Mobile/iOS Variant: Client Service Implementation

Use `references/api-consumer-contract.md` when the service maps or consumes
remote API behavior.

## Rules
- Isolate device capabilities behind service abstractions.
- Keep remote and local data sources synchronized through explicit policy.
- Avoid blocking main-thread flows in critical paths.
- Use deterministic retry and cache rules for unstable networks.
- Enforce secure handling for local sensitive data.
- Isolate iOS platform services and device capabilities behind explicit abstractions.
- Keep cache, sync, retry, and background work policies deterministic under iOS execution limits.
- Avoid blocking main-thread paths and make cancellation/lifecycle ownership explicit.
- Protect local sensitive data using iOS-appropriate secure storage boundaries.

## Typical Checks
- cache coherence and staleness windows
- secure storage boundaries
- background execution constraints
- background task assumptions
- secure storage and service-boundary ownership
- retry/cache policy under app lifecycle interruption
