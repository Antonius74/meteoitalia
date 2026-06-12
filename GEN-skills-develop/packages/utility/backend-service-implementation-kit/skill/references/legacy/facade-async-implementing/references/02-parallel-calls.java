/**
 * Example 2: Parallel Service Calls with Mono.zip()
 * Pattern: Multiple independent services executed in parallel
 */
@Service("ObiFacadePaas")
public class ObiFacadePaas extends FacadeBase {

    @Autowired
    private ObiService obiService;

    @Autowired
    private CardService cardService;

    @Override
    public Mono<GetObiDataFacadeResponse> getObiData(GetObiDataFacadeRequest request) {
        // Prepare parallel calls
        Mono<ObiDataResponse> obiData = generateServiceRequestAsync(request, GetObiDataServiceRequest.class)
                .flatMap(obiService::getObiData);
        Mono<CardDataResponse> cardData = generateServiceRequestAsync(request, GetCardDataServiceRequest.class)
                .flatMap(cardService::getCardData);
        Mono<BalanceResponse> balance = generateServiceRequestAsync(request, GetBalanceServiceRequest.class)
                .flatMap(cardService::getBalance);

        // Execute in parallel
        return Mono.zip(obiData, cardData, balance)
                .flatMap(tuple ->
                    generateFacadeResponseAsync(GetObiDataFacadeResponse.class, request)
                        .map(facadeResponse -> {
                            // Merge all responses
                            BeanUtils.copyProperties(tuple.getT1(), facadeResponse);
                            facadeResponse.setCardInfo(tuple.getT2().getCardInfo());
                            facadeResponse.setBalance(tuple.getT3().getAvailableBalance());
                            return facadeResponse;
                        })
                );
    }
}
