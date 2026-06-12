/**
 * Example 4: Session Enrichment During Mapping
 * Use for: Retrieve session data to enrich response during transformation
 * Source: GetCardInfoAllFromFacadeMapper.java
 */
package it.icbpi.digitalreview.paymentservice.layers.controller.mapper;

import it.icbpi.digitalreview.archcomps.context.card.domain.general.CardInfo;
import it.icbpi.digitalreview.archcomps.context.user.NexiUserInterface;
import it.icbpi.digitalreview.archcomps.layers.controller.adapter.responsemapper.PayloadResponseMapper;
import it.icbpi.digitalreview.paymentdomain.dto.domain.GetCardInfoItemList;
import it.icbpi.digitalreview.paymentdomain.dto.domain.WalletCardDataItem;
import it.icbpi.digitalreview.paymentdomain.dto.response.GetCardInfoListPayloadResponse;
import it.icbpi.digitalreview.paymentservice.layers.facade.dto.response.GetCardInfoAllFacadeResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import static it.icbpi.digitalreview.paymentdomain.constant.SessionKey.C2P_VISA_ENROLL_PENDING;
import static it.icbpi.digitalreview.projectdependencies.utils.card.CardUtilConstants.Circuit.VISA;

@Lazy
@Component("GetCardInfoAllFromFacadeMapper")
public class GetCardInfoAllFromFacadeMapper
    extends PayloadResponseMapper<GetCardInfoAllFacadeResponse, GetCardInfoListPayloadResponse> {

    @Value("${ark.nexiUser.session:true}")
    protected boolean nexiUserInSession;

    @Override
    public Mono<GetCardInfoListPayloadResponse> mapAsync(Mono<GetCardInfoAllFacadeResponse> source) {
        return source.flatMap(s -> {
            // Base mapping first
            GetCardInfoListPayloadResponse target = super.mapSource(s);
            NexiUserInterface nexiUser = s.getLoggedUser();

            if (nexiUser != null) {
                // Retrieve session data during mapping
                Mono<HashMap<Long, Boolean>> cardIdClickToPayVisaPendingMono =
                    nexiSessionManager.getAsync(C2P_VISA_ENROLL_PENDING);

                return cardIdClickToPayVisaPendingMono.mapNotNull(cardIdClickToPayVisaPending -> {
                    // Enrich target with session data
                    if (target.getGetCardInfoPayloadResponse() != null &&
                            !target.getGetCardInfoPayloadResponse().isEmpty()) {

                        for (GetCardInfoItemList item : target.getGetCardInfoPayloadResponse()) {
                            final Long cardId = item.getCardId();
                            CardInfo cardInfo = nexiUser.getCardInfo(cardId);
                            final boolean isVisa = VISA.equalsIgnoreCase(
                                cardInfo.getGeneralData().getCircuitDetail()
                            );

                            // Stream transformation with session data
                            if (isVisa && item.getWalletCardDataList() != null &&
                                    !item.getWalletCardDataList().isEmpty()) {
                                List<WalletCardDataItem> walletCardDataSummaryList =
                                    item.getWalletCardDataList().stream()
                                        .map(w -> {
                                            if ("C".equalsIgnoreCase(w.getWalletProvider())) {
                                                // Enrich from session
                                                w.setIsEnrollmentPending(
                                                    cardIdClickToPayVisaPending.get(cardId)
                                                );
                                            }
                                            return w;
                                        })
                                        .collect(Collectors.toList());

                                item.setWalletCardDataList(walletCardDataSummaryList);
                            }
                        }
                    }
                    return target;
                });
            }

            return Mono.just(target);
        });
    }

    @Override
    public Mono<GetCardInfoAllFacadeResponse> saveInSessionAsync(Mono<GetCardInfoAllFacadeResponse> source) {
        if (nexiUserInSession)
            return source.share()
                    .flatMap(s -> nexiSessionManager.putAsync(s.getLoggedUser()).thenReturn(s))
                    .flatMap(s -> super.saveInSessionAsync(Mono.just(s)));
        return super.saveInSessionAsync(source);
    }
}
