# Enricher Sync Patterns

Real repo examples:

- `portal-be/micro-services/authentication/authentication-service/src/main/java/it/icbpi/digitalreview/authenticationservice/layers/controller/enricher/ValidateStateEnricherDefault.java`
- `portal-be/micro-services/bankstatement/bankstatement-service/src/main/java/it/icbpi/digitalreview/bankstatementservice/layers/controller/enricher/CheckBSDocumentsAvailabilityEnricher.java`
- `portal-be/micro-services/card/card-service/src/main/java/it/icbpi/digitalreview/cardservice/layers/controller/enricher/GetPinViewEnricherDefault.java`

Common sync shape:

```java
@Override
public RequestType enrichRequestFromSession(RequestType source) throws MicroServiceException {
    DataType value = nexiSessionManager.get(SESSION_KEY);
    if (value == null) {
        throw new MicroServiceException(ErrorCode.SESSION_EXPIRED.toString(), source.getClient());
    }
    source.setData(value);
    return source;
}
```

Repo patterns:

- set default card/session values directly on the request
- derive session keys from the request type or card id
- use `getOrFail(...)` when the data is mandatory
- keep the enricher stateless

Do not move business logic here. If the request needs real processing, keep that in the facade.
