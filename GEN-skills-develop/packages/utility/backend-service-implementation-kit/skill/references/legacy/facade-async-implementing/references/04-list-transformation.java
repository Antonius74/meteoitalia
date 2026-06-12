/**
 * Example 5: List Transformation with Streams
 * Pattern: Transform service response collections into facade DTOs
 */
@Service("EntityFacadeDefault")
public class EntityFacadeDefault extends FacadeBase {

    @Autowired
    private EntityService entityService;

    @Override
    public Mono<GetListFacadeResponse> getList(GetListFacadeRequest request) {
        NexiUserInterface loggedUser = request.getLoggedUser();

        return Mono.zip(
                    loggedUser.getUserInfoAsync(),
                    generateServiceRequestAsync(request, GetListServiceRequest.class)
                )
                .flatMap(tuple -> {
                    UserInfo userInfo = tuple.getT1();
                    GetListServiceRequest serviceRequest = tuple.getT2();

                    serviceRequest.setUserId(userInfo.getUserId());
                    serviceRequest.setFilter(request.getFilter());

                    return entityService.getList(serviceRequest);
                })
                .flatMap(serviceResponse ->
                    generateFacadeResponseAsync(GetListFacadeResponse.class, request)
                        .map(facadeResponse -> {
                            // Transform list with stream operations
                            List<FacadeItem> facadeItems = serviceResponse.getItems().stream()
                                    .filter(item -> item.isActive())  // Filter
                                    .map(serviceItem -> {
                                        FacadeItem facadeItem = new FacadeItem();
                                        BeanUtils.copyProperties(serviceItem, facadeItem);

                                        // Custom transformations
                                        facadeItem.setDisplayName(formatDisplayName(serviceItem));
                                        facadeItem.setEnriched(enrichItem(serviceItem));

                                        return facadeItem;
                                    })
                                    .sorted(Comparator.comparing(FacadeItem::getPriority))
                                    .collect(Collectors.toList());

                            facadeResponse.setItems(facadeItems);
                            facadeResponse.setTotalCount(facadeItems.size());

                            return facadeResponse;
                        })
                );
    }

    private String formatDisplayName(ServiceItem item) {
        return String.format("%s - %s", item.getCode(), item.getName());
    }

    private boolean enrichItem(ServiceItem item) {
        // Business logic for enrichment
        return item.getStatus() != null && "ACTIVE".equals(item.getStatus());
    }
}
