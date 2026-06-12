# REST Service Sync Patterns

Real repo examples:

- `common-services/common-parent/common-project/rest-domain/rest-ams/src/main/java/it/icbpi/digitalreview/rest/ams/impl/AmsRestServiceImpl.java`
- `common-services/common-parent/common-project/rest-domain/rest-acn-psd2/src/main/java/it/icbpi/digitalreview/rest/psd2/impl/Psd2RestServiceImpl.java`
- `common-services/common-parent/common-project/rest-domain/rest-iam/src/main/java/it/icbpi/digitalreview/rest/iam/impl/IamRestServiceImpl.java`
- `common-services/common-parent/common-project/rest-domain/rest-iam/src/main/java/it/icbpi/digitalreview/rest/iam/IamRestService.java`

Legacy sync shape:

```java
HttpHeaders headers = httpUtils.getHeadersForAMSCalls(...);
HttpEntity<String> httpRequest = new HttpEntity<>(jsonBody, headers);
ResponseEntity<SomeResponse> exchange =
        exchangeOkOrFail(url, HttpMethod.POST, httpRequest, SomeResponse.class, null);
return exchange.getBody();
```

Repo conventions:

- `@Service("...Impl")` implementation classes for blocking clients
- `@Value` endpoint injection instead of hardcoded URLs
- custom `RestMicroServiceExceptionMapper` for status/body translation

Prefer this skill for older client code and migration work. The modern `@HttpExchange` interface-only style lives in the async skill set.
