/**
 * Example 5: Conditional Session Save with Configuration Flag
 * Use for: Optional session save based on application property
 */
package it.icbpi.digitalreview.paymentservice.layers.controller.mapper;

import it.icbpi.digitalreview.archcomps.layers.controller.adapter.responsemapper.PayloadResponseMapper;
import it.icbpi.digitalreview.paymentdomain.dto.response.ProcessPaymentPayloadResponse;
import it.icbpi.digitalreview.paymentservice.layers.facade.dto.response.ProcessPaymentFacadeResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Lazy
@Component("ProcessPaymentPayloadResponseFromFacadeMapper")
public class ProcessPaymentPayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<ProcessPaymentFacadeResponse, ProcessPaymentPayloadResponse> {

    // Configuration flag from application.yml
    @Value("${ark.nexiUser.session:true}")
    protected boolean nexiUserInSession;

    @Override
    public Mono<ProcessPaymentFacadeResponse> saveInSessionAsync(Mono<ProcessPaymentFacadeResponse> source) {
        // Conditional save based on configuration
        if (nexiUserInSession) {
            return source.flatMap(s ->
                    nexiSessionManager.putAsync(s.getLoggedUser())
                        .thenReturn(s)
            ).flatMap(s -> super.saveInSessionAsync(Mono.just(s)));
        }
        // Skip session save if disabled
        return super.saveInSessionAsync(source);
    }

    @Override
    public void saveInSession(ProcessPaymentFacadeResponse source) {
        // Sync version (legacy)
        if (nexiUserInSession)
            nexiSessionManager.put(source.getLoggedUser());
    }

    @Override
    public Mono<ProcessPaymentPayloadResponse> mapAsync(Mono<ProcessPaymentFacadeResponse> source) {
        return source
                .map(s -> {
                    ProcessPaymentPayloadResponse target = super.mapSource(s);
                    target.setTransactionId(s.getTransactionId());
                    target.setStatus(s.getStatus());
                    return target;
                });
    }
}
