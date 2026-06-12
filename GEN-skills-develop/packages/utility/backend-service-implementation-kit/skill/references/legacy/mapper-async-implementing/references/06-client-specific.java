/**
 * Example 6: Client-Specific Override Pattern
 * Use for: Different mapping/session logic per client (PT, MPS, CoBa, etc.)
 * Source: SetWorkingAreaPayloadResponseFromFacadeMapperPt.java
 */
package it.icbpi.digitalreview.userservice.layers.controller.response.mapper;

import it.icbpi.digitalreview.archcomps.layers.controller.adapter.responsemapper.PayloadResponseMapper;
import it.icbpi.digitalreview.userdomain.dto.SetWorkingAreaPayloadResponse;
import it.icbpi.digitalreview.userservice.layers.controller.UserUtil;
import it.icbpi.digitalreview.userservice.layers.facade.dto.response.SetWorkingAreaFacadeResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

// Default implementation (base for all clients)
@Lazy
@Component("SetWorkingAreaPayloadResponseFromFacadeMapper")
public class SetWorkingAreaPayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<SetWorkingAreaFacadeResponse, SetWorkingAreaPayloadResponse> {

    @Override
    public Mono<SetWorkingAreaFacadeResponse> saveInSessionAsync(Mono<SetWorkingAreaFacadeResponse> source) {
        return source.share()
                .flatMap(s -> nexiSessionManager.putAsync(s.getWorkingAreaData()))
                .then(super.saveInSessionAsync(source));
    }

    @Override
    public Mono<SetWorkingAreaPayloadResponse> mapAsync(Mono<SetWorkingAreaFacadeResponse> source) {
        return super.mapAsync(source)
                .flatMap(target -> source.map(s -> {
                    target.setWorkingArea(s.getWorkingArea());
                    target.setCompleted(s.isCompleted());
                    return target;
                }));
    }
}

// PT-specific override (adds custom session save)
@Lazy
@Component("SetWorkingAreaPayloadResponseFromFacadeMapperPt")
public class SetWorkingAreaPayloadResponseFromFacadeMapperPt
    extends SetWorkingAreaPayloadResponseFromFacadeMapper {

    @Override
    public void saveInSession(SetWorkingAreaFacadeResponse source) {
        // PT-specific: use utility to save web data
        UserUtil.saveWebData(source, nexiSessionManager);
    }

    @Override
    public Mono<SetWorkingAreaFacadeResponse> saveInSessionAsync(Mono<SetWorkingAreaFacadeResponse> source) {
        return source.flatMap(s -> {
                    // PT-specific async save
                    UserUtil.saveWebDataAsync(s, nexiSessionManager);
                    return Mono.just(s);
                })
                .flatMap(s -> super.saveInSessionAsync(Mono.just(s)));
    }
}

// MPS-specific override (different mapping logic)
@Lazy
@Component("SetWorkingAreaPayloadResponseFromFacadeMapperMPS")
public class SetWorkingAreaPayloadResponseFromFacadeMapperMPS
    extends SetWorkingAreaPayloadResponseFromFacadeMapper {

    @Override
    public Mono<SetWorkingAreaPayloadResponse> mapAsync(Mono<SetWorkingAreaFacadeResponse> source) {
        return source
                .map(s -> {
                    SetWorkingAreaPayloadResponse target = super.mapSource(s);
                    // MPS-specific field mapping
                    target.setWorkingArea(s.getWorkingArea());
                    target.setMpsSpecificField(s.getMpsData());
                    return target;
                });
    }
}
