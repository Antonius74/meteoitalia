# Facade Sync Patterns

Real repo examples:

- `portal-be/micro-services/login/login-service/src/main/java/it/icbpi/digitalreview/login/layers/facade/impl/LoginFacadeDefault.java`
- `portal-be/micro-services/card/card-service/src/main/java/it/icbpi/digitalreview/cardservice/layers/facade/impl/CardFacadeDefault.java`
- `portal-be/micro-services/payment/payment-service/src/main/java/it/icbpi/digitalreview/paymentservice/layers/facade/impl/PaymentFacadeDefault.java`

Common sync shape:

```java
ServiceRequestType serviceRequest = generateServiceRequest(request, ServiceRequestType.class);
serviceRequest.setSpecificField(request.getSpecificField());

ServiceResponseType serviceResponse = service.operation(serviceRequest);
FacadeResponseType facadeResponse = generateFacadeResponse(FacadeResponseType.class, request);
BeanUtils.copyProperties(serviceResponse, facadeResponse);
return facadeResponse;
```

Patterns used in the repo:

- state-machine updates before returning the facade response
- direct `NexiUserInterface` access for session-driven logic
- conditional merges from multiple service calls
- validation and `MicroServiceException` failures before the service call

Legacy note:

- Some facades contain both sync and reactive methods. For sync work, keep the return type blocking and do not introduce `Mono` unless the interface already uses it.
