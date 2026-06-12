/**
 * Example 7: Legacy Synchronous Mapper Pattern
 * Use for: Old code paths that still use synchronous save/map methods
 */
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapper")
public class [Operation]PayloadResponseFromFacadeMapper
        extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {

    @Override
    public void saveInSession([Operation]FacadeResponse source) {
        if (source.getStateMachine() != null)
            nexiSessionManager.put(source.getStateMachine());
        if (source.getFlowInfo() != null)
            nexiSessionManager.put(source.getFlowInfo());
    }

    @Override
    public [Operation]PayloadResponse map([Operation]FacadeResponse source) {
        [Operation]PayloadResponse target = super.map(source);
        BeanUtils.copyProperties(source, target);
        return target;
    }
}
