/**
 * Example 1: Simple REST Call (MT Microservices)
 * Pattern: generateMicroSoaRestRequestAsync → REST client → extract body → generate response
 * Source: UserServiceImpl.java pattern
 */
@Service("UserServiceImpl")
public class UserServiceImpl extends NexiBaseService implements UserService {

    @Autowired
    private UserRestClient userRestClient;

    @Override
    public Mono<GetUserDataServiceResponse> getUserData(GetUserDataServiceRequest request) {
        // 1. Input validation
        if (Strings.isNullOrEmpty(request.getUserId()))
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.USER_ID_REQUIRED.toString(),
                request.getClient()
            ));

        // 2. Generate REST request (auto-populates client, loggedUser, cardId)
        return generateMicroSoaRestRequestAsync(request, GetUserDataRestRequest.class)
                .map(restRequest -> {
                    // 3. Map service request fields to REST request
                    BeanUtils.copyProperties(request, restRequest);
                    restRequest.setUserId(request.getUserId());
                    restRequest.setIncludeDetails(request.isIncludeDetails());
                    return restRequest;
                })
                // 4. Call REST client (returns ResponseEntity)
                .flatMap(userRestClient::getUserData)
                // 5. Generate service response and access body in mapping
                .flatMap(restResponse -> generateServiceResponseAsync(GetUserDataServiceResponse.class, request)
                        .map(response -> {
                            // 6. Map REST response to service response
                            BeanUtils.copyProperties(restResponse, response);
                            // 7. Custom field mapping
                            response.setDataRetrieved(true);
                            return response;
                        })
                );
    }
}
