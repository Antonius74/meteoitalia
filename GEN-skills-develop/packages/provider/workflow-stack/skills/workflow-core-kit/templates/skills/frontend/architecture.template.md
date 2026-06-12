# Frontend Overlay: Architecture

Apply this overlay after the shared architecture template.

- Define boundaries between UI components, state management, and data clients.
- Apply `references/api-consumer-contract.md` when mapping API contracts to frontend clients, state, or UI behavior.
- When `artifacts.api_contract` or an explicitly provided `api-contract.md` exists, treat it as the backend API handoff for client, state, and UI behavior mapping.
- Do not create or regenerate `api-contract.md`; frontend architecture consumes that backend handoff when it is available.
- If no API handoff is available, record an open question only when API behavior cannot be planned from requirements and other provided sources.
- Specify rendering-state transitions for loading, empty, success, and error views.
- Keep transport concerns isolated from presentation components.
- Add localization implementation notes whenever user-facing copy is introduced or changed.

## Localization Implementation Notes

Create a dedicated section in `implementation-plan.md` whenever the
implementation adds or changes user-facing copy.

- Use English text for route-local or component-local `defaultMessage` values.
- Do not hardcode non-English design copy as the `defaultMessage`.
- Add or update i18n message descriptors for every user-facing string.
- Add locale-specific translations through the existing translation layer when the target bank, flavor, or locale requires translated copy.
- Keep CTA labels, modal titles, body text, aria labels, validation messages, empty states, and analytics labels aligned with the message descriptors.
- Verify fallback behavior when locale-specific translations are missing.

Use a localization task table with at least these columns:

- `Task`
- `Requirement`
- `File / Area`
- `Expected Outcome`
