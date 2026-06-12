# API Contract Handoff

> **Generated:** {{DATE}}
> **Based on:** {{REQ_FILE}}
> **Total Requirements:** {{REQ_COUNT}}

---

## Summary

- **API Impact:** <!-- New | Changed | Removed | None -->
- **Producer:** <!-- backend service or boundary that owns the API -->
- **Consumers:** <!-- frontend, mobile-android, mobile-ios, external systems -->
- **Contract Source of Truth:** <!-- OpenAPI/Swagger/AsyncAPI/GraphQL/schema path, or "This handoff only" -->

When this backend run has no API-impacting changes, write:

> No API-impacting changes identified for this backend architecture run.

---

## Contract Sources

| Source | Location | Used For | Notes |
|--------|----------|----------|-------|
| <!-- requirements, OpenAPI path, ADR, README, Jira --> | <!-- path, URL, operation id, schema, or issue key --> | <!-- endpoint, schema, auth, error mapping --> | <!-- conflict/gap notes --> |

---

## Operations

| Operation | Method | Path | Requirement | Change | Auth / Permissions | Request | Success Response | Error Responses |
|-----------|--------|------|-------------|--------|--------------------|---------|------------------|-----------------|
| <!-- operationId or name --> | <!-- GET/POST/... --> | <!-- /resource --> | <!-- REQ-xxx --> | <!-- create/change/remove/no-op --> | <!-- role/scope/session --> | <!-- fields, params, headers --> | <!-- status + response schema --> | <!-- status + error shape --> |

---

## Payload Schemas

### Request Schemas

| Schema | Requirement | Fields | Validation Rules | Notes |
|--------|-------------|--------|------------------|-------|
| <!-- schema name --> | <!-- REQ-xxx --> | <!-- field: type, required/optional --> | <!-- constraints --> | <!-- compatibility notes --> |

### Response Schemas

| Schema | Requirement | Fields | Nullability / Defaults | Notes |
|--------|-------------|--------|------------------------|-------|
| <!-- schema name --> | <!-- REQ-xxx --> | <!-- field: type --> | <!-- nullable/default/missing behavior --> | <!-- consumer mapping notes --> |

---

## Status And Error Mapping

| Condition | Status / Code | Error Shape | Consumer Handling |
|-----------|---------------|-------------|-------------------|
| <!-- validation failure, not found, conflict, authorization, dependency outage --> | <!-- HTTP status or domain code --> | <!-- fields returned --> | <!-- UI/mobile state, retry, degraded behavior --> |

---

## Compatibility And Versioning

| Area | Compatibility Impact | Migration / Rollout Notes |
|------|----------------------|---------------------------|
| <!-- operation/schema/header/status --> | <!-- compatible/breaking/unknown --> | <!-- sequencing, feature flag, deprecation, required consumer change --> |

---

## Consumer Implementation Notes

| Consumer | Required Mapping | Fallback / Degraded Behavior | Test Notes |
|----------|------------------|------------------------------|------------|
| <!-- frontend/mobile-android/mobile-ios --> | <!-- local client/state/screen mapping --> | <!-- loading/error/empty/retry/offline --> | <!-- useful TC-U/TC-E2E/TC-M hints --> |

---

## Open Questions And Risks

| # | Question or Risk | Impact if Wrong | Owner | Status |
|---|------------------|-----------------|-------|--------|
| AC-01 | <!-- unresolved contract question or risk --> | <!-- what breaks or changes --> | <!-- backend/frontend/mobile/product --> | Awaiting Gate 2 approval |

**Gate 2 decision:** <!-- Approved / Revision requested - add date and notes -->

---

## Traceability Matrix

{{TRACEABILITY_MATRIX}}
