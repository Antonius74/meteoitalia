# Controller Sync Patterns

Real repo examples:

- `portal-be/micro-services/authentication/authentication-service/src/main/java/it/icbpi/digitalreview/authenticationservice/layers/controller/impl/AuthenticationControllerImpl.java`
- `portal-be/micro-services/bankstatement/bankstatement-service/src/main/java/it/icbpi/digitalreview/bankstatementservice/layers/controller/impl/BankStatementControllerImpl.java`
- `portal-be/micro-services/login/login-service/src/main/java/it/icbpi/digitalreview/login/layers/controller/impl/LoginControllerImpl.java`

Typical sync shape:

```java
Facade facade = adapterFactory.getSpecificAdapterFromDefault(FacadeDefault.class);
RequestType facadeRequest = generateFacadeRequest(request, RequestType.class);
// only if needed
Enricher enricher = adapterFactory.getSpecificAdapterFromDefault(EnricherDefault.class);
enricher.enrichRequestFromSession(facadeRequest);

FacadeResponseType facadeResponse = facade.operation(facadeRequest);
Mapper mapper = adapterFactory.getSpecificAdapterFromDefault(Mapper.class);
mapper.saveInSession(facadeResponse);   // only if needed
PayloadResponseType payload = mapper.map(facadeResponse);
return generateControllerResponse(payload, HttpStatus.OK);
```

What to preserve:

- `@Valid` and `@RequestBody` on inputs
- `generateFacadeRequest(...)` before enrichment
- `saveInSession(...)` before or after `map(...)` depending on the existing flow
- `@Lazy` / `@Component` lookup for enrichers and mappers

Mixed sync/reactive files still exist in the repo. For sync controller work, prefer the blocking path and avoid introducing `Mono` unless the interface already requires it.
