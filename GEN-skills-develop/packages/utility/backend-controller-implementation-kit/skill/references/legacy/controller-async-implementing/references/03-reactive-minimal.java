/**
 * Example 3: Minimal Reactive (Read-Only)
 * Use for: Simple read operations without session interaction
 */
@Override
public Mono<ResponseEntity<GetK6StatusPayloadResponse>> getK6Status(
    @Valid @RequestBody GetK6StatusPayloadRequest request
) throws MicroServiceException {
    // 1. Generate facade request
    GetK6StatusFacadeRequest facadeRequest = generateFacadeRequest(request, GetK6StatusFacadeRequest.class);

    // 2. Get facade
    SecurityFacade facade = adapterFactory.getSpecificAdapterFromDefault(SecurityFacadeDefault.class);

    // 3. Get mapper
    GetK6StatusResponseFromFacadeMapper mapper = adapterFactory.getSpecificAdapterFromDefault(GetK6StatusResponseFromFacadeMapper.class);

    // 4. Simple chain
    return facade.getK6Status(facadeRequest)
            .flatMap(r -> mapper.mapAsync(Mono.just(r)))
            .map(r -> generateControllerResponse(r, HttpStatus.OK));
}
