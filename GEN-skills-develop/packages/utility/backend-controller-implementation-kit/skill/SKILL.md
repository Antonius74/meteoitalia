---
name: backend-controller-implementation-kit
description: Implement backend controller and endpoint layers with backend-specific orchestration constraints.
---

# Backend Controller Implementation Kit

Use this skill for backend controller and endpoint entry-point implementation.

## Reference Templates

- controller implementation pattern: [references/backend/controller-implementation.template.md](references/backend/controller-implementation.template.md)

## Embedded Source Specifications


## Source Skill: `controller-async-implementing`


# Controller Method Implementation

Controllers orchestrate the 4-layer architecture: delegate to facades, use mappers for DTO transformation, and enrichers for session data.

## Standard Flow

```
generateFacadeRequest() -> [Enricher] -> Facade -> Mapper -> generateControllerResponse()
```

## Core Principles

- **Thin controllers** - Orchestration only, no business logic
- **AdapterFactory** - Client-specific bean resolution
- **Context propagation** - `generateFacadeRequest()` auto-populates client/loggedUser/cardId
- **Reactive-first** - Return `Mono<ResponseEntity<T>>`

## Dependency Boundary Check

- Do not satisfy missing collaborator, DTO, client, mapper, facade, service, or generated-contract types by creating code in dependency libraries.
- Ask for confirmation only when the dependency boundary blocks the requested implementation or test evidence.
- Resolve controllers, facades, mappers, enrichers, and DTOs from the current repository or confirmed existing dependencies. If the required contract is missing or unverifiable, record the expected owner and minimum required shape instead of inventing dependency-library code.

## Patterns

### 1. Reactive with Session Save - RECOMMENDED
```java
@Override
public Mono<ResponseEntity<[Operation]PayloadResponse>> [operationName](
    @Valid @RequestBody [Operation]PayloadRequest request
) throws MicroServiceException {
    [Operation]FacadeRequest facadeRequest = generateFacadeRequest(request, [Operation]FacadeRequest.class);
    [Entity]Facade facade = adapterFactory.getSpecificAdapterFromDefault([Entity]FacadeDefault.class);
    [Operation]ResponseMapper mapper = adapterFactory.getSpecificAdapterFromDefault([Operation]ResponseMapper.class);

    return facade.[operationName](facadeRequest).share()
            .flatMap(r -> mapper.saveInSessionAsync(Mono.just(r)))
            .flatMap(r -> mapper.mapAsync(Mono.just(r)))
            .map(r -> generateControllerResponse(r, HttpStatus.OK));
}
```

### 2. Reactive with Enricher
```java
@Override
public Mono<ResponseEntity<[Operation]PayloadResponse>> [operationName](
    @Valid @RequestBody [Operation]PayloadRequest request
) throws MicroServiceException {
    [Operation]FacadeRequest facadeRequest = generateFacadeRequest(request, [Operation]FacadeRequest.class);

    [Operation]EnricherDefault enricher = adapterFactory.getSpecificAdapterFromDefault([Operation]EnricherDefault.class);
    enricher.enrichRequestModify(facadeRequest);  // Enrich AFTER context propagation

    [Entity]Facade facade = adapterFactory.getSpecificAdapterFromDefault([Entity]FacadeDefault.class);
    [Operation]ResponseMapper mapper = adapterFactory.getSpecificAdapterFromDefault([Operation]ResponseMapper.class);

    return enricher.enrichRequestFromSessionAsync(facadeRequest)
            .flatMap(facade::[operationName])
            .flatMap(r -> mapper.mapAsync(Mono.just(r)))
            .map(r -> generateControllerResponse(r, HttpStatus.OK));
}
```

### 3. Reactive Minimal (Read-Only)
```java
@Override
public Mono<ResponseEntity<[Operation]PayloadResponse>> [operationName](
    @Valid @RequestBody [Operation]PayloadRequest request
) throws MicroServiceException {
    [Operation]FacadeRequest facadeRequest = generateFacadeRequest(request, [Operation]FacadeRequest.class);
    [Entity]Facade facade = adapterFactory.getSpecificAdapterFromDefault([Entity]FacadeDefault.class);
    [Operation]ResponseMapper mapper = adapterFactory.getSpecificAdapterFromDefault([Operation]ResponseMapper.class);

    return facade.[operationName](facadeRequest)
            .flatMap(r -> mapper.mapAsync(Mono.just(r)))
            .map(r -> generateControllerResponse(r, HttpStatus.OK));
}
```

### 4. Synchronous (Legacy - Avoid)
```java
@Override
public ResponseEntity<[Operation]PayloadResponse> [operationName](
    @Valid @RequestBody [Operation]PayloadRequest request
) throws MicroServiceException {
    [Operation]FacadeRequest facadeRequest = generateFacadeRequest(request, [Operation]FacadeRequest.class);
    [Entity]Facade facade = adapterFactory.getSpecificAdapterFromDefault([Entity]FacadeDefault.class);
    [Operation]FacadeResponse facadeResponse = facade.[operationName](facadeRequest);

    [Operation]ResponseMapper mapper = adapterFactory.getSpecificAdapterFromDefault([Operation]ResponseMapper.class);
    [Operation]PayloadResponse response = mapper.map(facadeResponse);

    return generateControllerResponse(response, HttpStatus.OK);
}
```

## Naming Conventions

```
Controller:       [Entity]ControllerImpl.java
Payload DTOs:     [Operation]PayloadRequest/Response.java
Facade DTOs:      [Operation]FacadeRequest/Response.java
Enricher:         [Operation]Enricher[Client].java
Mapper:           [Operation]ResponseFromFacadeMapper[Client].java
Facade:           [Entity]Facade[Client].java
```

**Client Suffixes**: Default, MPS, PtWeb, Pa, DBank, CoBa, App, Paas

## Common Annotations

```java
@Override                           // Interface implementation
@Valid @RequestBody [Request]       // Validation
@UserRefresh(types = UserRefreshType.ALL_CARDS_SERVICE_LIST_REFRESH)  // User context refresh
```

## Decision Matrix

| Scenario | Pattern | Chain                                               |
|----------|---------|-----------------------------------------------------|
| Async + session save | 1 | `facade -> flatMap(save) -> flatMap(map) -> map(wrap)` |
| Async + session read | 2 | `enrich -> facade -> flatMap(map) -> map(wrap)`        |
| Simple read | 3 | `facade -> flatMap(map) -> map(wrap)`                 |
| Legacy | 4 | Blocking calls, sync methods                        |


## Implementation Checklist
1. Signature: `Mono<ResponseEntity<[Operation]PayloadResponse>>`
2. Context: `generateFacadeRequest(request, [Operation]FacadeRequest.class)`
3. Enricher (if needed): `enricher.enrichRequestFromSessionAsync(facadeRequest)`
4. Facade: `adapterFactory.getSpecificAdapterFromDefault([Entity]FacadeDefault.class)`
5. Mapper: `adapterFactory.getSpecificAdapterFromDefault([Operation]ResponseMapper.class)`
6. Chain: `facade -> flatMap(save) -> flatMap(map) -> map(wrap)`

## Best Practices
- `@Valid` for validation
- `generateFacadeRequest()` for context
- `Mono<ResponseEntity<T>>` for new methods
- AdapterFactory (never `new`)
- `flatMap` for async, `map` for sync
- No business logic in controller
- No direct service calls
- No `.block()` or `.subscribe()`
- No manual context copying

## Examples
See `references/legacy/controller-async-implementing/references/`:
- `01-simple-reactive.java` - Standard async with session save
- `02-reactive-with-enricher.java` - With session enrichment
- `03-reactive-minimal.java` - Read-only operation

## Source Skill: `controller-sync-implementing`


# Controller Sync Implementation

Use this when the controller returns `ResponseEntity<T>` and the orchestration is fully synchronous.

- Flow: `generateFacadeRequest(...) -> enricher -> facade -> mapper -> generateControllerResponse(...)`
- Keep controllers thin. No business logic, no direct service calls, no manual context copy.
- Resolve collaborators through `AdapterFactory.getSpecificAdapterFromDefault(...)`.
- Use sync `enrichRequestFromSession()`, `map()`, and `saveInSession()`.
- See `references/legacy/controller-sync-implementing/references/patterns.md` for real repo examples and legacy edge cases.
