# Mobile/Android Overlay: Architecture

- Separate navigation flow, screen state, and data synchronization concerns.
- Apply `references/api-consumer-contract.md` when Android screens, services, or repositories consume remote APIs.
- When `artifacts.api_contract` or an explicitly provided `api-contract.md` exists, treat it as the backend API handoff for Android client/service, repository, persistence, and screen-state mapping.
- Do not create or regenerate `api-contract.md`; Android architecture consumes that backend handoff when it is available.
- If no API handoff is available, record an open question only when API behavior cannot be planned from requirements and other provided sources.
- Define persistence/cache strategy for intermittent connectivity.
- Document lifecycle-safe boundaries for long-running or resumable tasks.
- Define boundaries for Activities, Fragments, Compose screens, services, and platform capability adapters.
- Document lifecycle-safe handling for process death, foreground/background transitions, and configuration changes.
- Identify Android-specific persistence, sync, and dependency edges that must remain testable.
