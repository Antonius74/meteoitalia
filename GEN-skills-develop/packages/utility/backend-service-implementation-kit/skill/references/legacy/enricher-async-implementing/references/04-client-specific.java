/**
 * Example 4: Client-Specific Override Pattern
 * Use for: Extending default enricher with client-specific logic
 */
package it.icbpi.digitalreview.userservice.layers.controller.enricher;

import it.icbpi.digitalreview.archcomps.enrichsession.impl.EnrichImpl;
import it.icbpi.digitalreview.userservice.layers.facade.dto.request.ChoiceMethodFacadeRequest;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

// Default implementation (base)
@Lazy
@Component("ChoiceMethodEnricherDefault")
public class ChoiceMethodEnricherDefault extends EnrichImpl<ChoiceMethodFacadeRequest> {

    private static final String FLOW_STATE = "FLOW_STATE";

    @Override
    public Mono<ChoiceMethodFacadeRequest> enrichRequestFromSessionAsync(ChoiceMethodFacadeRequest source) {
        return nexiSessionManager.getAsync(FLOW_STATE)
                .defaultIfEmpty(new FlowState())
                .cast(FlowState.class)
                .flatMap(state -> {
                    source.setFlowState(state);
                    return super.enrichRequestFromSessionAsync(source);
                });
    }
}

// Client-specific override (CoBa)
@Lazy
@Component("ChoiceMethodEnricherCoBa")
public class ChoiceMethodEnricherCoBa extends ChoiceMethodEnricherDefault {

    @Override
    public Mono<ChoiceMethodFacadeRequest> enrichRequestFromSessionAsync(ChoiceMethodFacadeRequest source) {
        // CoBa-specific: also retrieve state machine
        return Mono.zip(
                nexiSessionManager.getAsync(FLOW_STATE).defaultIfEmpty(new FlowState()).cast(FlowState.class),
                nexiSessionManager.getOrFailAsync(CobaStateMachine.class)
        ).flatMap(tuple -> {
            source.setFlowState(tuple.getT1());
            source.setStateMachine(tuple.getT2());
            // Call parent's super (skips ChoiceMethodEnricherDefault logic)
            return super.enrichRequestFromSessionAsync(source);
        });
    }
}

// Client-specific override (Paas)
@Lazy
@Component("ChoiceMethodEnricherPaas")
public class ChoiceMethodEnricherPaas extends ChoiceMethodEnricherDefault {

    @Override
    public Mono<ChoiceMethodFacadeRequest> enrichRequestFromSessionAsync(ChoiceMethodFacadeRequest source) {
        // Paas-specific: retrieve different keys
        return Mono.zip(
                nexiSessionManager.getAsync("PAAS_FLOW_STATE").defaultIfEmpty(new FlowState()).cast(FlowState.class),
                nexiSessionManager.getAsync("PAAS_CONFIG").defaultIfEmpty(new PaasConfig()).cast(PaasConfig.class)
        ).flatMap(tuple -> {
            source.setFlowState(tuple.getT1());
            source.setPaasConfig(tuple.getT2());
            return super.enrichRequestFromSessionAsync(source);
        });
    }
}
