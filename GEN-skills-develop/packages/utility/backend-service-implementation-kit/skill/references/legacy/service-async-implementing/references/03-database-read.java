/**
 * Example 3: Database Read Operation (Sync - Blocking)
 * Pattern: JPA repository wrapped in ReactiveUtils.wrap()
 * DB operations are ALWAYS synchronous in this architecture
 * Source: UserServiceImpl.java database patterns
 */
@Service("UserServiceImpl")
public class UserServiceImpl extends NexiBaseService implements UserService {

    @Autowired
    private UserRepository userRepository;  // JPA repository (blocking)

    @Override
    public Mono<GetUserServiceResponse> getUserByFiscalCode(GetUserServiceRequest request) {
        if (Strings.isNullOrEmpty(request.getFiscalCode()))
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.FISCAL_CODE_REQUIRED.toString(),
                request.getClient()
            ));

        // DB operations are always synchronous - wrap in ReactiveUtils.wrap()
        return ReactiveUtils.wrap(() -> {
                    // Blocking JPA call
                    Optional<UserEntity> userOptional = userRepository.findByFiscalCode(request.getFiscalCode());

                    if (!userOptional.isPresent())
                        throw new MicroServiceException(
                            ErrorCode.USER_NOT_FOUND.toString(),
                            request.getClient()
                        );

                    return userOptional.get();
                })
                .flatMap(userEntity -> generateServiceResponseAsync(GetUserServiceResponse.class, request)
                        .map(response -> {
                            response.setUserId(userEntity.getUserId());
                            response.setFiscalCode(userEntity.getFiscalCode());
                            response.setEmail(userEntity.getEmail());
                            response.setPhoneNumber(userEntity.getPhoneNumber());
                            response.setActive(userEntity.isActive());
                            return response;
                        })
                );
    }

    @Override
    public Mono<GetUserByIdServiceResponse> getUserById(GetUserByIdServiceRequest request) {
        if (request.getUserId() == null)
            return Mono.error(() -> new MicroServiceException(
                ErrorCode.USER_ID_REQUIRED.toString(),
                request.getClient()
            ));

        return ReactiveUtils.wrap(() -> {
                    Optional<UserEntity> userOptional = userRepository.findById(request.getUserId());

                    if (!userOptional.isPresent())
                        throw new MicroServiceException(
                            ErrorCode.USER_NOT_FOUND.toString(),
                            request.getClient()
                        );

                    return userOptional.get();
                })
                .flatMap(userEntity -> generateServiceResponseAsync(GetUserByIdServiceResponse.class, request)
                        .map(response -> {
                            response.setUserId(userEntity.getUserId());
                            response.setFiscalCode(userEntity.getFiscalCode());
                            response.setEmail(userEntity.getEmail());
                            return response;
                        })
                );
    }
}
