# Mobile/Android Overlay: Test Design

- Add tests for app lifecycle transitions and state restoration.
- Apply `references/api-consumer-contract.md` for Android API consumption, offline, and unavailable-service coverage.
- Add automation or manual tester coverage for core screen flows and permission branches, depending on device and service readiness.
- Include offline/reconnect scenarios for data-dependent flows.
- Add coverage for Android lifecycle transitions, permission branches, and state restoration after process recreation.
- Include device/API matrix considerations where behavior can vary by SDK level or OEM implementation, and mark unavailable device coverage as blocked with substitute evidence.
- Exercise offline/reconnect and notification/background resume paths for data-dependent flows.
