# Frontend Overlay: Development

Apply this overlay after the shared development template.

- Implement deterministic state transitions and avoid side-effect leakage in view layers.
- Apply `references/api-consumer-contract.md` for API client, adapter, state, and error-normalization work.
- When `artifacts.api_contract` exists, implement client, adapter, state, and UI error handling against the backend API handoff instead of inventing transport behavior.
- Keep accessibility behavior explicit (keyboard navigation, ARIA semantics).
- Normalize backend errors into stable UI-consumable states so frontend `TC-U-xxx` cases can run even when backend services are unavailable.
- After tests and build checks are green, use `documentation-design-kit` reconciliation when a public design mapping changed: new or renamed central component, changed props, variants, states, accessibility behavior, route or page composition, Figma reference, token-source reference, or Code Connect reference.
- Do not update `DESIGN.md` for internal-only refactors that preserve the same public design mapping.
