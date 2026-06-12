# Mapper Sync Patterns

Real repo examples:

- `portal-be/micro-services/authentication/authentication-service/src/main/java/it/icbpi/digitalreview/authenticationservice/layers/controller/mapper/GenerateStateAndNoncePayloadResponseFromFacadeMapper.java`
- `portal-be/micro-services/bankstatement/bankstatement-service/src/main/java/it/icbpi/digitalreview/bankstatementservice/layers/controller/mapper/response/GetCurrentBankStatementPayloadResponseFromFacadeMapper.java`
- `portal-be/micro-services/card/card-service/src/main/java/it/icbpi/digitalreview/cardservice/layers/controller/mapper/response/ActivateCardPayloadResponseFromFacadeMapper.java`
- `portal-be/micro-services/login/login-service/src/main/java/it/icbpi/digitalreview/login/layers/controller/mapper/impl/FinalizeLoginPayloadResponseFromFacadeMapper.java`

Common sync shape:

```java
@Override
public PayloadResponse map(FacadeResponse source) {
    PayloadResponse target = super.map(source);
    target.setField(source.getField());
    return target;
}

@Override
public void saveInSession(FacadeResponse source) {
    super.saveInSession(source);
    nexiSessionManager.put(source.getLoggedUser());
}
```

Repo patterns:

- persist only the data that later steps need
- use `@Value("${ark.nexiUser.session:true}")` for conditional `NexiUserInterface` session writes
- update derived values on the mapped payload when the current flow depends on them
- let helper methods handle complex payload enrichment, as in login/card mappers

Avoid mixing transformation and session writes in the same branch unless the existing mapper already does it that way.
