# Backend Variant: Service Implementation

This template extends shared development guidance with backend service-layer rules.

## Rules
- Keep service interfaces stable and backward-compatible where required.
- Validate input contracts before invoking downstream dependencies.
- Isolate external calls behind service clients or adapters.
- Define explicit timeout and retry behavior for outbound calls.
- Return structured error categories suitable for API consumption.

## Typical Checks
- API contract compatibility
- persistence consistency
- idempotency on retriable flows
