/**
 * Example 2: AMS REST Call (Auto Card Context)
 * Pattern: generateAMSRestRequestAsync auto-populates uniqueRegNumber and cardId
 * Source: ObiServiceImplPaas.java pattern for AMS calls
 */
@Service("CardServiceImpl")
public class CardServiceImpl extends NexiBaseService implements CardService {

    @Autowired
    private AmsRestClient amsRestClient;

    @Override
    public Mono<GetCardDetailsServiceResponse> getCardDetails(GetCardDetailsServiceRequest request) {
        // Validation
        if (request.getCardId() == null)
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.CARD_ID_REQUIRED.toString(),
                request.getClient()
            ));

        // generateAMSRestRequestAsync auto-populates:
        // - uniqueRegNumber (from card context)
        // - cardId (from request)
        return generateAMSRestRequestAsync(request, GetCardDetailsRestRequest.class)
                .map(restRequest -> {
                    // uniqueRegNumber and cardId already set by generator!
                    restRequest.setIncludeTransactions(request.isIncludeTransactions());
                    restRequest.setDateFrom(request.getDateFrom());
                    return restRequest;
                })
                .flatMap(amsRestClient::getCardDetails)
                .map(ResponseEntity::getBody)
                .flatMap(body -> generateServiceResponseAsync(GetCardDetailsServiceResponse.class, request)
                        .map(response -> {
                            BeanUtils.copyProperties(body, response);
                            response.setCardNumber(body.getMaskedPan());
                            response.setBalance(body.getAvailableBalance());
                            return response;
                        })
                );
    }

    @Override
    public Mono<BlockCardServiceResponse> blockCard(BlockCardServiceRequest request) {
        return generateAMSRestRequestAsync(request, BlockCardRestRequest.class)
                .map(restRequest -> {
                    // uniqueRegNumber, cardId auto-set
                    restRequest.setBlockReason(request.getReason());
                    restRequest.setBlockType(request.getBlockType());
                    return restRequest;
                })
                .flatMap(amsRestClient::blockCard)
                .flatMap(restResponse -> generateServiceResponseAsync(BlockCardServiceResponse.class, request)
                        .map(response -> {
                            response.setBlocked(restResponse.getBody().isSuccess());
                            response.setBlockDate(restResponse.getBody().getBlockDate());
                            return response;
                        })
                );
    }
}
