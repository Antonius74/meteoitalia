# Frontend Variant: API Integration

This template extends shared development guidance with frontend network-integration rules.

Use `references/api-consumer-contract.md` as the shared API consumption
contract for request mapping, response parsing, error normalization, and
degraded-service behavior.

## Rules
- Encapsulate API calls in dedicated client modules.
- Normalize transport errors into UI-consumable states.
- Prevent duplicate requests for the same user action.
- Keep request cancellation behavior explicit during navigation or unmount.
- Avoid leaking secret or environment-sensitive values in client logs.

## Typical Checks
- request deduplication and cancellation
- UI fallback behavior on API failure
- serialization and parsing consistency
