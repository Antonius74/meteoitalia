# Mobile/iOS Variant: Screen Flow Implementation

## Rules
- Respect app lifecycle transitions and state restoration.
- Keep navigation state and data state decoupled.
- Handle interrupted flows such as background, process kill, and reconnect.
- Provide deterministic behavior for network-loss scenarios.
- Keep device permission checks explicit and recoverable.
- Respect iOS app lifecycle transitions and state restoration behavior.
- Keep navigation state, persisted screen state, and transient UI state clearly separated.
- Make permission prompts, universal links, and interrupted/resumed flows recoverable.
- Ensure offline or reconnect handling is deterministic across foreground/background transitions.

## Typical Checks
- screen restore behavior
- navigation back-stack correctness
- offline or reconnect handling
- restore behavior after app interruption or relaunch
- iOS navigation-stack correctness
- permission denial and recovery handling
