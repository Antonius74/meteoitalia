/**
 * Example 2: Configuration with MT Filter
 * Source: IssuingK6RestServiceConfig.java
 * Bean creation with MTServiceFilter for MT microservices
 *
 * IMPORTANT: All request DTOs must extend BaseMicroSoaRestServiceRequest
 *            All response DTOs must extend BaseMicroSoaRestServiceResponse
 */
package it.icbpi.digitalreview.rest.issuingk6.config;

import it.icbpi.digitalreview.archcomps.restclient.soa.filters.MTServiceFilter;
import it.icbpi.digitalreview.archcomps.restclient.soa.filters.support.ArchRestServiceSupportUtils;
import it.icbpi.digitalreview.archcomps.restclient.soa.jwt.JwtHandlerFactory;
import it.icbpi.digitalreview.archcomps.utils.http.HttpUtils;
import it.icbpi.digitalreview.rest.issuingk6.IssuingK6RestService;
import it.icbpi.digitalreview.rest.issuingk6.config.mapper.MTStatusCodeExceptionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

import static it.icbpi.digitalreview.archcomps.restclient.soa.filters.support.ArchRestServiceSupportUtils.buildRestExceptionMapperFilter;

/**
 * Configuration class for IssuingK6RestService
 * Creates Spring-managed bean using ArchRestServiceSupportUtils
 */
@Configuration
public class IssuingK6RestServiceConfig {

    /**
     * Creates REST service client with:
     * - MTServiceFilter: Adds JWT authentication and MT-specific headers
     * - MTStatusCodeExceptionMapper: Maps HTTP errors to business exceptions
     */
    @Bean
    public IssuingK6RestService issuingK6RestService(
            @Autowired JwtHandlerFactory jwtHandlerFactory,
            @Autowired HttpUtils httpUtils,
            @Autowired ArchRestServiceSupportUtils utils) {

        return utils.buildHttpExchangeClient(
            IssuingK6RestService.class,                                        // Interface class
            List.of(new MicroSoaFilter(jwtHandlerFactory, httpUtils))          // Request/response filters
        );
    }
}
