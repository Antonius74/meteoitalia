/**
 * Example 3: User Context with NexiUserInterface Async Methods
 * Pattern: Access user data using async methods + Mono.zip for parallel context retrieval
 */
@Service("UserFacadeDefault")
public class UserFacadeDefault extends FacadeBase {

    @Autowired
    private UserService userService;

    @Override
    public Mono<ProcessUserFacadeResponse> processUser(ProcessUserFacadeRequest request) {
        NexiUserInterface loggedUser = request.getLoggedUser();

        // Get user context in parallel with service request generation
        return Mono.zip(
                    loggedUser.getUserInfoAsync(),
                    loggedUser.getCardInfoAsync(request.getCardId()),
                    loggedUser.getOperativitaAsync(),
                    generateServiceRequestAsync(request, ProcessUserServiceRequest.class)
                )
                .flatMap(tuple -> {
                    UserInfo userInfo = tuple.getT1();
                    CardInfo cardInfo = tuple.getT2();
                    Operativita operativita = tuple.getT3();
                    ProcessUserServiceRequest serviceRequest = tuple.getT4();

                    // Populate service request with user context
                    serviceRequest.setFiscalCode(userInfo.getFiscalCode());
                    serviceRequest.setEmail(userInfo.getEmail());

                    if (cardInfo != null && cardInfo.getGeneralData() != null) {
                        serviceRequest.setPan(cardInfo.getGeneralData().getPan());
                        serviceRequest.setCardType(cardInfo.getGeneralData().getCardType());
                    }

                    serviceRequest.setOperativeLevel(operativita.getLevel());

                    return serviceRequest;
                })
                .flatMap(userService::processUser)
                .flatMap(serviceResponse ->
                    generateFacadeResponseAsync(ProcessUserFacadeResponse.class, request)
                        .map(facadeResponse -> {
                            BeanUtils.copyProperties(serviceResponse, facadeResponse);
                            return facadeResponse;
                        })
                );
    }
}
