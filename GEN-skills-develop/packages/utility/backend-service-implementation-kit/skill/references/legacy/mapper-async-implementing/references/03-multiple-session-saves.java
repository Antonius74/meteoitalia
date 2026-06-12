/**
 * Example 3: Multiple Parallel Session Saves with Mono.when
 * Use for: Save multiple objects to session in parallel
 * Source: CheckInputPayloadResponseFromFacadeMapper.java
 */
package it.icbpi.digitalreview.userservice.layers.controller.mapper.response;

import it.icbpi.digitalreview.archcomps.layers.controller.adapter.responsemapper.PayloadResponseMapper;
import it.icbpi.digitalreview.userdomain.dto.CheckInputPayloadResponse;
import it.icbpi.digitalreview.userservice.layers.facade.dto.response.CheckInputFacadeResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Lazy
@Component("CheckInputPayloadResponseFromFacadeMapper")
public class CheckInputPayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<CheckInputFacadeResponse, CheckInputPayloadResponse> {

    @Override
    public Mono<CheckInputFacadeResponse> saveInSessionAsync(Mono<CheckInputFacadeResponse> source) {
        // Mono.when executes multiple async operations in parallel
        // Completes when ALL operations complete (doesn't pass values forward)
        return source.flatMap(s ->
                Mono.when(
                        // Save state machine (if not null)
                        s.getStateMachine() != null
                                ? nexiSessionManager.putAsync(s.getStateMachine())
                                : Mono.empty(),
                        // Save flow info (always)
                        nexiSessionManager.putAsync(s.getRetrieveCredentialsInfo())
                )
                .thenReturn(s)  // Return s after all saves complete
        ).flatMap(s -> super.saveInSessionAsync(Mono.just(s)));  // Chain base save
    }

    @Override
    public Mono<CheckInputPayloadResponse> mapAsync(Mono<CheckInputFacadeResponse> source) {
        return source
                .map(s -> {
                    CheckInputPayloadResponse target = super.mapSource(s);
                    // Map fields from nested object
                    target.setCredentialsForgotten(s.getRetrieveCredentialsInfo().getCredentialsForgotten());
                    target.setVerificationMethod(s.getRetrieveCredentialsInfo().getVerificationMethod());
                    return target;
                });
    }
}
