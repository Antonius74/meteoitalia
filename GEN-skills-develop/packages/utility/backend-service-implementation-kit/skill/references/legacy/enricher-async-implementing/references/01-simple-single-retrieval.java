/**
 * Example 1: Simple Single Retrieval
 * Use for: Retrieving one item from session with validation
 */
package it.icbpi.digitalreview.subscriptionservice.layers.controller.enrich;

import it.icbpi.digitalreview.archcomps.enrichsession.impl.EnrichImpl;
import it.icbpi.digitalreview.archcomps.exception.ArchErrorCode;
import it.icbpi.digitalreview.archcomps.exception.UnauthorisedMicroServiceException;
import it.icbpi.digitalreview.subscriptionservice.layers.facade.dto.request.ActivateSmsServiceFacadeRequest;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Lazy
@Component("ActivateSmsServiceEnrichDefault")
public class ActivateSmsServiceEnrichDefault extends EnrichImpl<ActivateSmsServiceFacadeRequest> {

    private static final String SMS_CONFIG_KEY = "SMS_CONFIG";

    @Override
    public Mono<ActivateSmsServiceFacadeRequest> enrichRequestFromSessionAsync(ActivateSmsServiceFacadeRequest source) {
        return nexiSessionManager.getAsync(SMS_CONFIG_KEY)
                .defaultIfEmpty(new SmsConfiguration())
                .cast(SmsConfiguration.class)
                .flatMap(config -> {
                    if (config == null || config.isEmpty()) {
                        return Mono.error(() -> new UnauthorisedMicroServiceException(
                                ArchErrorCode.SESSION_EXPIRED.toString(),
                                source.getClient(),
                                null,
                                HttpStatus.UNAUTHORIZED
                        ));
                    }
                    source.setSmsConfiguration(config);
                    return super.enrichRequestFromSessionAsync(source);
                });
    }
}
