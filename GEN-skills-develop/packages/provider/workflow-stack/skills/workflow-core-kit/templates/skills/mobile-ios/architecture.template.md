# Mobile/iOS Overlay: Architecture

- Separate navigation flow, screen state, and data synchronization concerns.
- Apply `references/api-consumer-contract.md` when iOS screens, services, or repositories consume remote APIs.
- When `artifacts.api_contract` or an explicitly provided `api-contract.md` exists, treat it as the backend API handoff for iOS client/service, persistence, coordinator, and screen-state mapping.
- Do not create or regenerate `api-contract.md`; iOS architecture consumes that backend handoff when it is available.
- If no API handoff is available, record an open question only when API behavior cannot be planned from requirements and other provided sources.
- Define persistence/cache strategy for intermittent connectivity.
- Document lifecycle-safe boundaries for long-running or resumable tasks.
- Define boundaries for UIKit/SwiftUI screens, coordinators/navigation flow, services, and platform capability adapters.
- Document lifecycle-safe handling for foreground/background transitions, state restoration, and resumable tasks.
- Identify iOS-specific persistence, sync, and framework boundaries that must remain testable.
