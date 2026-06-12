# Service Sync Patterns

Real repo examples:

- `portal-be/micro-services/login/login-service/src/main/java/it/icbpi/digitalreview/login/layers/service/login/impl/LoginServiceImpl.java`
- `portal-be/micro-services/card/card-service/src/main/java/it/icbpi/digitalreview/cardservice/layers/service/card/impl/CardServiceImpl.java`
- `portal-be/micro-services/login/login-service/src/main/java/it/icbpi/digitalreview/login/layers/service/asb/impl/LoginASBServiceImpl.java`

Common sync shape:

```java
if (Strings.isNullOrEmpty(request.getId())) {
    throw new MicroServiceException(ErrorCode.INVALID_INPUT.toString(), request.getClient());
}

RestServiceRequest restRequest = generateMicroSoaRestRequest(request, RestServiceRequest.class);
BeanUtils.copyProperties(request, restRequest);

RestServiceResponse restResponse = restClient.operation(restRequest);
ServiceResponse response = generateServiceResponse(ServiceResponse.class, request);
BeanUtils.copyProperties(restResponse, response);
return response;
```

Repo-specific sync variants:

- direct repository access for DB-backed reads
- `ReactiveUtils.await(...)` when a sync service must call a reactive REST client
- `ResponseEntity.getBody()` extraction after legacy REST exchanges
- explicit `MicroServiceException` translation for validation and remote failures

Keep blocking logic isolated. Do not add `.block()` in new sync code when `ReactiveUtils.await(...)` already exists in the surrounding module.
