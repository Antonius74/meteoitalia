/**
 * Example 7: Legacy Synchronous Pattern
 * Pattern: Blocking/sync operations (avoid for new implementations)
 * Source: UserServiceImpl.java legacy methods
 */
@Service("LegacyServiceImpl")
public class LegacyServiceImpl extends ServiceImplBase {

    @Autowired
    private LegacyRestClient legacyRestClient;

    @Autowired
    private UserRepository userRepository;  // JPA repository (blocking)

    // Legacy sync REST call
    @Override
    public GetDataServiceResponse getDataSync(GetDataServiceRequest request) throws MicroServiceException {
        // Validation
        if (Strings.isNullOrEmpty(request.getDataId()))
            throw new MicroServiceException(
                ErrorCode.DATA_ID_REQUIRED.toString(),
                request.getClient()
            );

        // Generate REST request (sync version)
        GetDataRestRequest restRequest = generateMicroSoaRestRequest(request, GetDataRestRequest.class);
        restRequest.setDataId(request.getDataId());
        restRequest.setIncludeDetails(request.isIncludeDetails());

        // REST call (blocking)
        ResponseEntity<GetDataRestResponse> responseEntity = legacyRestClient.getData(restRequest);
        GetDataRestResponse body = responseEntity.getBody();

        if (body == null)
            throw new MicroServiceException(
                ErrorCode.DEFAULT_PT_ERROR.toString(),
                request.getClient()
            );

        // Generate service response (sync version)
        GetDataServiceResponse response = generateServiceResponse(GetDataServiceResponse.class, request);
        BeanUtils.copyProperties(body, response);
        response.setProcessed(true);

        return response;
    }

    // Legacy sync database operation
    @Override
    public GetUserServiceResponse getUserSync(GetUserServiceRequest request) throws MicroServiceException {
        if (request.getUserId() == null)
            throw new MicroServiceException(
                ErrorCode.USER_ID_REQUIRED.toString(),
                request.getClient()
            );

        // JPA repository call (blocking)
        Optional<UserEntity> userOptional = userRepository.findById(request.getUserId());

        if (!userOptional.isPresent())
            throw new MicroServiceException(
                ErrorCode.USER_NOT_FOUND.toString(),
                request.getClient()
            );

        UserEntity userEntity = userOptional.get();

        // Generate response
        GetUserServiceResponse response = generateServiceResponse(GetUserServiceResponse.class, request);
        response.setUserId(userEntity.getUserId());
        response.setFiscalCode(userEntity.getFiscalCode());
        response.setEmail(userEntity.getEmail());

        return response;
    }

    // Legacy sync with try-catch error handling
    @Override
    public ProcessServiceResponse processSync(ProcessServiceRequest request) throws MicroServiceException {
        try {
            // Validation
            if (Strings.isNullOrEmpty(request.getTransactionId()))
                throw new MicroServiceException(
                    ErrorCode.TRANSACTION_ID_REQUIRED.toString(),
                    request.getClient()
                );

            // Generate REST request
            ProcessRestRequest restRequest = generateMTRestRequest(request, ProcessRestRequest.class);
            BeanUtils.copyProperties(request, restRequest);

            // REST call
            ResponseEntity<ProcessRestResponse> responseEntity = legacyRestClient.process(restRequest);
            ProcessRestResponse body = responseEntity.getBody();

            // Generate response
            ProcessServiceResponse response = generateServiceResponse(ProcessServiceResponse.class, request);
            BeanUtils.copyProperties(body, response);

            return response;

        } catch (HttpClientErrorException ex) {
            logger.error("4xx error calling external service", ex);
            throw new MicroServiceException(
                ErrorCode.EXTERNAL_SERVICE_ERROR.toString(),
                request.getClient()
            );
        } catch (HttpServerErrorException ex) {
            logger.error("5xx error calling external service", ex);
            throw new MicroServiceException(
                ErrorCode.SERVICE_UNAVAILABLE.toString(),
                request.getClient()
            );
        } catch (Exception ex) {
            logger.error("Unexpected error", ex);
            throw new MicroServiceException(
                ErrorCode.INTERNAL_ERROR.toString(),
                request.getClient()
            );
        }
    }

    // Migration path: Sync method calling async method (transitional)
    @Override
    public GetDataServiceResponse getDataMigration(GetDataServiceRequest request) throws MicroServiceException {
        try {
            // Call async version and block (transitional pattern)
            return ReactiveUtils.await(getDataAsync(request));
        } catch (Exception ex) {
            logger.error("Error in async call", ex);
            throw new MicroServiceException(
                ErrorCode.INTERNAL_ERROR.toString(),
                request.getClient()
            );
        }
    }

    // Async version for migration
    private Mono<GetDataServiceResponse> getDataAsync(GetDataServiceRequest request) {
        return generateMicroSoaRestRequestAsync(request, GetDataRestRequest.class)
                .map(restRequest -> {
                    restRequest.setDataId(request.getDataId());
                    return restRequest;
                })
                .flatMap(legacyRestClient::getDataAsync)
                .flatMap(body -> generateServiceResponseAsync(GetDataServiceResponse.class, request)
                        .map(response -> {
                            BeanUtils.copyProperties(body, response);
                            return response;
                        })
                );
    }
}
