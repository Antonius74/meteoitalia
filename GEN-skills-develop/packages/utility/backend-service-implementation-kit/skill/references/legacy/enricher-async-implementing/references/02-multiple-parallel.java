/**
 * Example 2: Multiple Parallel Retrieval with Mono.zip
 * Use for: Retrieving multiple items in parallel
 * Source: UpdateContactEnrichDefault.java
 */
package it.icbpi.digitalreview.subscriptionservice.layers.controller.enrich;

import it.icbpi.digitalreview.archcomps.context.phone.NexiPhoneNumber;
import it.icbpi.digitalreview.archcomps.enrichsession.impl.EnrichImpl;
import it.icbpi.digitalreview.archcomps.exception.ArchErrorCode;
import it.icbpi.digitalreview.archcomps.exception.UnauthorisedMicroServiceException;
import it.icbpi.digitalreview.subscriptionservice.layers.facade.dto.request.UpdateContactFacadeRequest;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Lazy
@Component("UpdateContactEnrichDefault")
public class UpdateContactEnrichDefault extends EnrichImpl<UpdateContactFacadeRequest> {

    public static final String TELEPHONE = "TELEPHONE_UPDATE_CONTACT";
    public static final String NEXI_PHONE_NUMBER = "NEXI_PHONE_NUMBER";

    @Override
    public Mono<UpdateContactFacadeRequest> enrichRequestFromSessionAsync(UpdateContactFacadeRequest source) {
        // Parallel retrieval with safe defaults
        Mono<String> newNumber = nexiSessionManager.getAsync(TELEPHONE)
                .defaultIfEmpty("");

        Mono<NexiPhoneNumber> nexiPhoneNumber = nexiSessionManager.getAsync(NEXI_PHONE_NUMBER)
                .defaultIfEmpty(new NexiPhoneNumber());

        // Zip both monos and process together
        return Mono.zip(newNumber, nexiPhoneNumber)
                .flatMap(tuple -> {
                    String number = tuple.getT1();
                    NexiPhoneNumber phoneNumber = tuple.getT2();

                    // Set fields on source
                    source.setNewNumber(number);
                    source.setNexiPhoneNumber(phoneNumber);

                    // Validation: at least one must be present
                    if (number.isEmpty() && phoneNumber.getTelephone().isEmpty()) {
                        return Mono.error(() -> new UnauthorisedMicroServiceException(
                                ArchErrorCode.SESSION_EXPIRED.toString(),
                                source.getClient(),
                                null,
                                HttpStatus.UNAUTHORIZED
                        ));
                    }

                    // Call super for base enrichment
                    return super.enrichRequestFromSessionAsync(source);
                });
    }
}
