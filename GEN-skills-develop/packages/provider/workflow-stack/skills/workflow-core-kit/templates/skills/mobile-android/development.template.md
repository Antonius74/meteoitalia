# Mobile/Android Overlay: Development

- Keep UI-thread safety explicit for performance-critical operations.
- Apply `references/api-consumer-contract.md` for Android API client, sync, cache, and degraded-service behavior.
- When `artifacts.api_contract` exists, implement Android client/service, repository, cache, and degraded-service handling against the backend API handoff instead of inventing transport behavior.
- Implement recovery paths for background interruptions and process restarts.
- Encapsulate device capability calls behind testable service abstractions.
- Keep main-thread safety, lifecycle ownership, and state restoration explicit in implementation steps.
- Isolate Android framework calls behind testable public boundaries instead of spreading them through feature logic.
- Handle permission flows, process recreation, and device/service availability failures deterministically.
- After tests and build checks are green, use `documentation-design-kit` reconciliation when a public design mapping changed: new or renamed central component, changed props, variants, states, accessibility behavior, screen composition, Figma reference, token-source reference, or Code Connect reference.
- Do not update `DESIGN.md` for internal-only refactors that preserve the same public design mapping.
