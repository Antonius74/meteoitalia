/**
 * Example 5: Feign Client Call (Blocking)
 * Pattern: Wrap Feign blocking calls in ReactiveUtils.wrap()
 * Feign clients are synchronous - must wrap in reactive context
 */
@Service("UserServiceImpl")
public class UserServiceImpl extends NexiBaseService implements UserService {

    @Autowired
    private PaymentServiceClient paymentServiceClient;

    @Override
    public Mono<ProcessPaymentServiceResponse> processPayment(ProcessPaymentServiceRequest request) {
        if (Strings.isNullOrEmpty(request.getTransactionId()))
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.TRANSACTION_ID_REQUIRED.toString(),
                request.getClient()
            ));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.INVALID_AMOUNT.toString(),
                request.getClient()
            ));

        // Feign clients are blocking - wrap in ReactiveUtils.wrap()
        return ReactiveUtils.wrap(() -> {
            // Build Feign request
            ProcessPaymentPayloadRequest feignRequest = new ProcessPaymentPayloadRequest();
            feignRequest.setTransactionId(request.getTransactionId());
            feignRequest.setAmount(request.getAmount());
            feignRequest.setCurrency(request.getCurrency());
            feignRequest.setMerchantId(request.getMerchantId());

            // Blocking Feign call
            ResponseEntity<ProcessPaymentPayloadResponse> feignResponse = paymentServiceClient.processPayment(feignRequest);
            return feignResponse.getBody();
        })
        .onErrorMap(FeignException.class, ex -> {
            logger.error("Feign call failed", ex);
            return new MicroServiceException(
                ErrorCode.EXTERNAL_SERVICE_ERROR.toString(),
                request.getClient()
            );
        })
        .flatMap(feignResponse -> generateServiceResponseAsync(ProcessPaymentServiceResponse.class, request)
                .map(response -> {
                    response.setTransactionId(feignResponse.getTransactionId());
                    response.setStatus(feignResponse.getStatus());
                    response.setAuthorizationCode(feignResponse.getAuthCode());
                    response.setProcessedDate(feignResponse.getTimestamp());
                    return response;
                })
        );
    }
}

// Feign Client Interface
@FeignClient(value = "payment-service", path = "payment")
public interface PaymentServiceClient {

    @PostMapping("/api/payment/process")
    ResponseEntity<ProcessPaymentPayloadResponse> processPayment(@RequestBody ProcessPaymentPayloadRequest request);
}
