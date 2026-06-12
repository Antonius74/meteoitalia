/**
 * Example 1: Simple Reactive Transformation
 * Use for: Basic DTO mapping without session operations
 */
package it.icbpi.digitalreview.userservice.layers.controller.mapper.response;

import it.icbpi.digitalreview.archcomps.layers.controller.adapter.responsemapper.PayloadResponseMapper;
import it.icbpi.digitalreview.userdomain.dto.CheckEmailPayloadResponse;
import it.icbpi.digitalreview.userservice.layers.facade.dto.response.CheckEmailFacadeResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Lazy
@Component("CheckEmailPayloadResponseFromFacadeMapper")
public class CheckEmailPayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<CheckEmailFacadeResponse, CheckEmailPayloadResponse> {

    @Override
    public Mono<CheckEmailPayloadResponse> mapAsync(Mono<CheckEmailFacadeResponse> source) {
        // Call super first for base mapping (BeanUtils.copyProperties)
        return source
                .map(s -> {
                    CheckEmailPayloadResponse target = super.mapSource(s);
                    // Custom field mapping
                    target.setEmailAddress(s.getEmailAddress());
                    target.setVerified(s.isVerified());
                    target.setCanModify(s.canModify());
                    return target;
                });
    }
}
