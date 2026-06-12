/**
 * Example 1: HttpExchange Interface (Basic Pattern)
 * Source: IssuingK6RestService.java
 * Interface-only approach with @HttpExchange annotations
 *
 * IMPORTANT: DTOs MUST extend base classes:
 * - SetK6Request extends BaseMicroSoaRestServiceRequest
 * - ValidateK6Request extends BaseMicroSoaRestServiceRequest
 * - SetK6Response extends BaseMicroSoaRestServiceResponse
 * - ValidateK6Response extends BaseMicroSoaRestServiceResponse
 */
package it.icbpi.digitalreview.rest.issuingk6;

import it.icbpi.digitalreview.rest.issuingk6.dto.request.SetK6Request;
import it.icbpi.digitalreview.rest.issuingk6.dto.request.ValidateK6Request;
import it.icbpi.digitalreview.rest.issuingk6.dto.response.SetK6Response;
import it.icbpi.digitalreview.rest.issuingk6.dto.response.ValidateK6Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;

import static it.icbpi.digitalreview.projectdependencies.utils.constants.RequestAttributeConstants.REQUEST;

/**
 * REST service for K6 (PIN) operations
 * No implementation class needed - Spring creates proxy from interface
 */
@HttpExchange
public interface IssuingK6RestService {

    /**
     * Validate K6 (PIN)
     * GET endpoint with query parameter
     */
    @GetExchange(url = "${issuingk6.validateK6.endpoint}")
    Mono<ValidateK6Response> validateK6(
        @RequestAttribute(REQUEST) ValidateK6Request request,
        @RequestParam("k6") String k6
    );

    /**
     * Set K6 (PIN)
     * POST endpoint - request object passed as attribute
     */
    @PostExchange(url = "${issuingk6.setK6.endpoint}")
    Mono<SetK6Response> setK6(
        @RequestAttribute(REQUEST) SetK6Request request
    );

    /**
     * Get K6 status
     * GET with multiple query params
     */
    @GetExchange(url = "${issuingk6.getK6Status.endpoint}")
    Mono<K6StatusResponse> getK6Status(
        @RequestAttribute(REQUEST) BaseK6Request request,
        @RequestParam("cardId") Long cardId,
        @RequestParam(value = "includeHistory", required = false) Boolean includeHistory
    );

    /**
     * Unlock K6
     * POST with request body
     */
    @PostExchange(url = "${issuingk6.unlockK6.endpoint}")
    Mono<UnlockK6Response> unlockK6(
        @RequestAttribute(REQUEST) UnlockK6Request request,
        @RequestBody UnlockK6Data data
    );
}
