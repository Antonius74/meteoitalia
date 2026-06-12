/**
 * Example 4: Legacy WebClient Implementation (Avoid)
 * Use for: Maintaining old REST adapter code only
 */
@Service("ServiceRestServiceImpl")
public class ServiceRestServiceImpl implements ServiceRestService {

    @Autowired
    private WebClient webClient;

    @Override
    public Mono<ResponseEntity<GetDataResponse>> getData(GetDataRequest request, String id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/data")
                        .queryParam("id", id)
                        .build())
                .header("Authorization", "Bearer " + request.getToken())
                .retrieve()
                .toEntity(GetDataResponse.class);
    }
}
