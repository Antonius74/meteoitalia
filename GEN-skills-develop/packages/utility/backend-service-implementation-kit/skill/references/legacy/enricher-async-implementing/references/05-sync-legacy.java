/**
 * Example 5: Synchronous Pattern (Legacy)
 * Use for: Legacy code or blocking operations (avoid for new code)
 * Source: CheckPhoneNumberEnricherDefault.java
 */
package it.icbpi.digitalreview.userservice.layers.controller.enricher;

import com.google.common.base.Strings;
import it.icbpi.digitalreview.archcomps.context.phone.NexiPhoneNumber;
import it.icbpi.digitalreview.archcomps.enrichsession.impl.EnrichImpl;
import it.icbpi.digitalreview.archcomps.exception.MicroServiceException;
import it.icbpi.digitalreview.userdomain.dto.domain.RetrieveCredentialsInfo;
import it.icbpi.digitalreview.userdomain.error.ErrorCode;
import it.icbpi.digitalreview.userservice.layers.facade.dto.request.CheckPhoneNumberFacadeRequest;
import it.icbpi.digitalreview.userservice.statemachine.impl.RetrieveUserCredentialsStateMachine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Lazy
@Component("CheckPhoneNumberEnricherDefault")
public class CheckPhoneNumberEnricherDefault extends EnrichImpl<CheckPhoneNumberFacadeRequest> {

    private static final Logger logger = LoggerFactory.getLogger(CheckPhoneNumberEnricherDefault.class);

    @Override
    public CheckPhoneNumberFacadeRequest enrichRequestFromSession(CheckPhoneNumberFacadeRequest source)
            throws MicroServiceException {

        // Validate input from payload request
        final NexiPhoneNumber nexiPhoneNumber = source.getNexiPhoneNumber();
        final String telephone = nexiPhoneNumber.getTelephone();
        final String prefix = nexiPhoneNumber.getPrefix();

        if (Strings.isNullOrEmpty(telephone) || Strings.isNullOrEmpty(prefix)) {
            logger.debug("the Telephone number is NULL or empty");
            throw new MicroServiceException(ErrorCode.DEFAULT_PT_ERROR.toString(), source.getClient());
        }

        // Synchronous session retrieval with getOrFail (throws if not found)
        source.setStateMachine(nexiSessionManager.getOrFail(RetrieveUserCredentialsStateMachine.class));
        source.setRetrieveCredentialsInfo(nexiSessionManager.getOrFail(RetrieveCredentialsInfo.class));

        return source;
    }
}
