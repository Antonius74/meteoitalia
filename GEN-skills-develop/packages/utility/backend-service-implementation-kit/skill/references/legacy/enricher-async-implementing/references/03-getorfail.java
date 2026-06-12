/**
 * Example 3: Strict Validation with getOrFailAsync
 * Use for: Required session data (fail immediately if missing)
 * Source: CheckInputEnricherCoBa.java
 */
package it.icbpi.digitalreview.userservice.layers.controller.enricher;

import it.icbpi.digitalreview.userdomain.dto.domain.RetrieveCredentialsInfo;
import it.icbpi.digitalreview.userservice.layers.facade.dto.request.CheckInputFacadeRequest;
import it.icbpi.digitalreview.userservice.statemachine.impl.RetrieveCredentialsStateMachineCoBa;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Lazy
@Component("CheckInputEnricherCoBa")
public class CheckInputEnricherCoBa extends CheckInputEnricherDefault {

    @Override
    public Mono<CheckInputFacadeRequest> enrichRequestFromSessionAsync(CheckInputFacadeRequest source) {
        // getOrFailAsync throws exception if data not found
        // No need for manual validation
        return Mono.zip(
                nexiSessionManager.getOrFailAsync(RetrieveCredentialsStateMachineCoBa.class),
                nexiSessionManager.getOrFailAsync(RetrieveCredentialsInfo.class),
                (stateMachine, retrieveCredentialsInfo) -> {
                    source.setStateMachine(stateMachine);
                    source.setRetrieveCredentialsInfo(retrieveCredentialsInfo);
                    return source;
                }
        );
    }
}
