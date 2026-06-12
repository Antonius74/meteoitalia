/**
 * Example 2: Reactive with Single Session Save
 * Use for: Save one object to session after facade processing
 */
package it.icbpi.digitalreview.userservice.layers.controller.mapper.response;

import it.icbpi.digitalreview.archcomps.layers.controller.adapter.responsemapper.PayloadResponseMapper;
import it.icbpi.digitalreview.userdomain.dto.CheckKey6EmailPayloadResponse;
import it.icbpi.digitalreview.userservice.layers.facade.dto.response.CheckKey6EmailFacadeResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Lazy
@Component("CheckKey6EmailPayloadResponseFromFacadeMapper")
public class CheckKey6EmailPayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<CheckKey6EmailFacadeResponse, CheckKey6EmailPayloadResponse> {

    @Override
    public Mono<CheckKey6EmailFacadeResponse> saveInSessionAsync(Mono<CheckKey6EmailFacadeResponse> source) {
        // Save state machine to session for next request in flow
        return source.flatMap(s -> {
                    if (s.getStateMachine() != null)
                        return nexiSessionManager.putAsync(s.getStateMachine()).thenReturn(s);
                    return Mono.just(s);  // Return as-is if null
                })
                .flatMap(s -> super.saveInSessionAsync(Mono.just(s)));  // Call base save
    }

    @Override
    public Mono<CheckKey6EmailPayloadResponse> mapAsync(Mono<CheckKey6EmailFacadeResponse> source) {
        return source
                .map(s -> {
                    CheckKey6EmailPayloadResponse target = super.mapSource(s);
                    target.setEmail(s.getEmail());
                    target.setNextStep(s.getNextStep());
                    return target;
                });
    }
}
