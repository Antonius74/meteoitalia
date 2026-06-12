/**
 * Example 6: Empty Placeholder Enricher
 * Use for: When client-specific enrichers need base class but default does nothing
 * Source: ActivateSmsServiceEnrichDefault.java (original)
 */
package it.icbpi.digitalreview.subscriptionservice.layers.controller.enrich;

import it.icbpi.digitalreview.archcomps.enrichsession.impl.EnrichImpl;
import it.icbpi.digitalreview.subscriptionservice.layers.facade.dto.request.ActivateSmsServiceFacadeRequest;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

/**
 * Empty enricher - serves as base for client-specific implementations
 * No enrichment logic in default, but client-specific enrichers can extend this
 * and add their own logic without affecting other clients
 */
@Lazy
@Component("ActivateSmsServiceEnrichDefault")
public class ActivateSmsServiceEnrichDefault extends EnrichImpl<ActivateSmsServiceFacadeRequest> {
    // Empty implementation
    // Client-specific enrichers like ActivateSmsServiceEnrichMPS would extend this
}
