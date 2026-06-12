/**
 * Example 1: Standard Reactive Pattern with Session Save
 * Use for: Standard async operations with session persistence
 */
@Override
public Mono<ResponseEntity<ValidateK6PayloadResponse>> validateK6(
    @Valid @RequestBody ValidateK6PayloadRequest request
) throws MicroServiceException {
    // 1. Context propagation
    ValidateK6FacadeRequest facadeRequest = generateFacadeRequest(request, ValidateK6FacadeRequest.class);

    // 2. Get facade (client-specific resolution)
    SecurityFacade facade = adapterFactory.getSpecificAdapterFromDefault(SecurityFacadeDefault.class);

    // 3. Get mapper
    ValidateK6ResponseFromFacadeMapper mapper = adapterFactory.getSpecificAdapterFromDefault(ValidateK6ResponseFromFacadeMapper.class);

    // 4. Chain: share → save → map → wrap
    return facade.validateK6(facadeRequest)
            .flatMap(r -> mapper.saveInSessionAsync(Mono.just(r)))
            .flatMap(r -> mapper.mapAsync(Mono.just(r)))
            .map(r -> generateControllerResponse(r, HttpStatus.OK));
}
