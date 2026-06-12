/**
 * Example 6: Error Handling and Validation
 * Pattern: Comprehensive validation and error recovery strategies
 * Source: UserServiceImpl.java validation patterns
 */
@Service("ValidationServiceImpl")
public class ValidationServiceImpl extends NexiBaseService implements ValidationService {

    @Autowired
    private PrimaryRestClient primaryRestClient;

    @Override
    public Mono<ProcessServiceResponse> processWithValidation(ProcessServiceRequest request) {
        // Multiple field validation
        if (Strings.isNullOrEmpty(request.getTransactionId()))
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.TRANSACTION_ID_REQUIRED.toString(),
                request.getClient()
            ));

        if (Strings.isNullOrEmpty(request.getUserId()) || Strings.isNullOrEmpty(request.getCardId()))
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.USER_CARD_REQUIRED.toString(),
                request.getClient()
            ));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.INVALID_AMOUNT.toString(),
                request.getClient()
            ));

        if (request.getAmount().compareTo(new BigDecimal("10000")) > 0)
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.AMOUNT_EXCEEDS_LIMIT.toString(),
                request.getClient()
            ));

        return generateMTRestRequestAsync(request, ProcessRestRequest.class)
                .map(restRequest -> {
                    BeanUtils.copyProperties(request, restRequest);
                    return restRequest;
                })
                .flatMap(primaryRestClient::process)
                // Specific error handling by exception type
                .onErrorResume(RestSocketTimeOutServiceException.class, ex -> {
                    logger.error("Primary service timeout", ex);
                    return Mono.error(() -> new MicroServiceException(
                        ErrorCode.SERVICE_TIMEOUT.toString(),
                        request.getClient()
                    ));
                })
                .onErrorResume(RestMicroServiceException.class, ex -> {
                    logger.error("Primary service error", ex);
                    return Mono.error(() -> new MicroServiceException(
                        ErrorCode.SERVICE_UNAVAILABLE.toString(),
                        request.getClient()
                    ));
                })
                .flatMap(body -> generateServiceResponseAsync(ProcessServiceResponse.class, request)
                        .map(response -> {
                            BeanUtils.copyProperties(body, response);
                            return response;
                        })
                );
    }

    @Override
    public Mono<GetDataServiceResponse> getDataWithFallback(GetDataServiceRequest request) {
        if (Strings.isNullOrEmpty(request.getDataId()))
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.DATA_ID_REQUIRED.toString(),
                request.getClient()
            ));

        return generateMicroSoaRestRequestAsync(request, GetDataRestRequest.class)
                .map(restRequest -> {
                    restRequest.setDataId(request.getDataId());
                    return restRequest;
                })
                // Try primary service first
                .flatMap(primaryRestClient::getData)
                // If fail, return default
                .onErrorReturn(createDefaultGetDataResponseEntity())
                .flatMap(restResponse -> generateServiceResponseAsync(GetDataServiceResponse.class, request)
                        .map(response -> {
                            BeanUtils.copyProperties(restResponse.getBody(), response);
                            return response;
                        })
                );
    }

    @Override
    public Mono<ValidateServiceResponse> validateWithLogging(ValidateServiceRequest request) {
        return generateMicroSoaRestRequestAsync(request, ValidateRestRequest.class)
                .map(restRequest -> {
                    BeanUtils.copyProperties(request, restRequest);
                    return restRequest;
                })
                .doOnNext(req -> logger.info("Calling validation service for: {}", req.getValidationId()))
                .flatMap(primaryRestClient::validate)
                .doOnNext(resp -> logger.info("Validation response received"))
                .doOnError(ex -> logger.error("Validation failed", ex))
                .onErrorMap(ex -> new MicroServiceException(
                    ErrorCode.VALIDATION_ERROR.toString(),
                    request.getClient()
                ))
                .flatMap(restResponse -> generateServiceResponseAsync(ValidateServiceResponse.class, request)
                        .map(response -> {
                            BeanUtils.copyProperties(restResponse.getBody(), response);
                            return response;
                        })
                );
    }

    private ResponseEntity<GetDataRestResponse> createDefaultGetDataResponseEntity() {
        GetDataRestResponse defaultResponse = new GetDataRestResponse();
        defaultResponse.setData(Collections.emptyList());
        defaultResponse.setDefaulted(true);
        defaultResponse.setMessage("Using default data due to service unavailability");
        return ResponseEntity.ok(defaultResponse);
    }
}
