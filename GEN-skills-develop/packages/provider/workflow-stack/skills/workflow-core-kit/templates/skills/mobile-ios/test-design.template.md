# Mobile/iOS Overlay: Test Design

- Add tests for app lifecycle transitions and state restoration.
- Apply `references/api-consumer-contract.md` for iOS API consumption, offline, and unavailable-service coverage.
- Add automation or manual tester coverage for core screen flows and permission branches, depending on simulator/device and service readiness.
- Include offline/reconnect scenarios for data-dependent flows.
- Add coverage for iOS lifecycle transitions, permission branches, and state restoration after interruption or relaunch.
- Include device/OS-version considerations where behavior can vary across supported iPhone/iPad targets, and mark unavailable device coverage as blocked with substitute evidence.
- Exercise offline/reconnect and notification/background resume paths for data-dependent flows.
