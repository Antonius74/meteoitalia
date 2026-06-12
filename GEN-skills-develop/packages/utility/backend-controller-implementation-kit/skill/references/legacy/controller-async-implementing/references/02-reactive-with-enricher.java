/**
 * Example 2: Reactive with Enricher
 * Use for: Operations requiring session data before processing
 */
@Override
public Mono<ResponseEntity<FinalizePayloadResponse>> finalize(
    @Valid @RequestBody FinalizePayloadRequest request
) throws MicroServiceException {
    // 1. Generate facade request
    FinalizeFacadeRequest facadeRequest = generateFacadeRequest(request, FinalizeFacadeRequest.class);

    // 2. Enrich from session (AFTER context propagation)
    FinalizeEnricherDefault enricher = adapterFactory.getSpecificAdapterFromDefault(FinalizeEnricherDefault.class);

    // 3. Get facade
    SecurityFacade facade = adapterFactory.getSpecificAdapterFromDefault(SecurityFacadeDefault.class);

    // 4. Get mapper
    FinalizePayloadResponseFromFacadeMapper mapper = adapterFactory.getSpecificAdapterFromDefault(FinalizePayloadResponseFromFacadeMapper.class);

    // 5. Chain: no share needed if no session save
    return enricher.enrichRequestFromSessionAsync(facadeRequest)
            .flatMap(facade::finalize)
            .flatMap(r -> mapper.mapAsync(Mono.just(r)))
            .map(r -> generateControllerResponse(r, HttpStatus.OK));
}
