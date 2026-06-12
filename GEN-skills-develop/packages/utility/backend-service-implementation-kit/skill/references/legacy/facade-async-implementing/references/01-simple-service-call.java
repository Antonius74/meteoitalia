/**
 * Example 1: Simple Service Call
 * Pattern: generateServiceRequestAsync → service call → generateFacadeResponseAsync
 */
@Service("EntityFacadeDefault")
public class EntityFacadeDefault extends FacadeBase {

    @Autowired
    private EntityService entityService;

    @Override
    public Mono<GetDataFacadeResponse> getData(GetDataFacadeRequest request) {
        return generateServiceRequestAsync(request, GetDataServiceRequest.class)
                .map(serviceRequest -> {
                    // Set request-specific fields
                    serviceRequest.setDataId(request.getDataId());
                    serviceRequest.setIncludeDetails(request.isIncludeDetails());

                    return serviceRequest;
                })
                .flatMap(entityService::getData)
                .flatMap(serviceResponse ->
                    generateFacadeResponseAsync(GetDataFacadeResponse.class, request)
                        .map(facadeResponse -> {
                            BeanUtils.copyProperties(serviceResponse, facadeResponse);
                            // custom field mapping if needed
                            facadeResponse.setProcessed(true);
                            return facadeResponse;
                        })
                );
    }
}
