---
name: backend-service-implementation-kit
description: Implement backend service-layer behavior using dedicated backend patterns.
---

# Backend Service Implementation Kit

Use this skill for backend service-layer implementation details.

## Reference Templates

- service implementation pattern: [references/backend/service-implementation.template.md](references/backend/service-implementation.template.md)

## Embedded Source Specifications


## Source Skill: `service-async-implementing`

# Service Async Implementation

Services handle data operations: REST endpoint calls, database queries, external API integration, and internal microservices API calls. They use request generators for auto-context propagation and reactive patterns for async execution.

## Core Principles

- **REST request generators** - Use generateXxxRestRequestAsync() from NexiBaseService
- **Reactive-first** - Return Mono<T> for async operations
- **Context propagation** - Generators auto-populate client, loggedUser, cardId
- **Error handling** - Validate inputs, throw MicroServiceException
- **generateServiceResponseAsync()** - Create response with base context
- **Database is sync** - Always use JPA with ReactiveUtils.wrap()

## Module Dependency Check

- Before adding new wiring, search for an existing injected async client in the owning module and reuse it when possible.
- Validate required inputs before the first downstream call.
- If you add new DTOs or service contracts, note any downstream module that will need a fresh install or build before tests compile.
- Do not satisfy missing collaborator, DTO, client, mapper, facade, service, or generated-contract types by creating code in dependency libraries.
- Ask for confirmation only when the dependency boundary blocks the requested implementation or test evidence.
- If a required dependency contract is missing or unverifiable, record the expected owner and minimum required shape, then stop or continue only with a documented assumption that keeps changes inside the current repository.

## REST Request Generators (NexiBaseService)

```java
// MT Microservices (standard - for all clients except Paas)
generateMicroSoaRestRequestAsync(serviceRequest, BaseMicroSoaRestServiceRequest.class)

// MT Services (same as MicroSoa but used ONLY for Paas client)
generateMTRestRequestAsync(serviceRequest, BaseMTRestServiceRequest.class)

// AMS (auto-populates uniqueRegNumber, cardId)
generateAMSRestRequestAsync(serviceRequest, BaseAMSRestServiceRequest.class)

// LCM
generateLCMRestRequestAsync(serviceRequest, BaseLCMRestServiceRequest.class)

// Notificator
generateNotificatorRestRequestAsync(serviceRequest, BaseNotificatorRestServiceRequest.class)
```

## Standard Flow

```
1. Input validation -> Validate required fields (e.g., Strings.isNullOrEmpty())
2. generateXxxRestRequestAsync() -> Create REST request with context
3. REST client call -> Call external service (returns ResponseEntity)
4. generateServiceResponseAsync() -> Create service response
5. Map fields -> Use BeanUtils.copyProperties() to map REST response body to service response
6. Return Mono<ServiceResponse>
```

## Patterns

### 1. Simple REST Call - MOST COMMON
**Use**: Call external REST service

```java
@Override
public Mono<GetDataServiceResponse> getData(GetDataServiceRequest request) {
    // Validation
    if (Strings.isNullOrEmpty(request.getDataId()))
        return Mono.error(() -> new MicroServiceException(ErrorCode.INVALID_INPUT.toString(), request.getClient()));

    return generateMicroSoaRestRequestAsync(request, GetDataRestRequest.class)
            .map(restRequest -> {
                BeanUtils.copyProperties(request, restRequest);
                restRequest.setSpecificField(request.getField());
                return restRequest;
            })
            .flatMap(restClient::getData)
            .flatMap(restResponse -> generateServiceResponseAsync(GetDataServiceResponse.class, request)
                    .map(response -> {
                        BeanUtils.copyProperties(restResponse, response);
                        // additional mapping if needed
                        return response;
                    })
            );
}
```

### 2. Database Read Operation (Sync - Blocking)
**Use**: Query database with JPA repository

```java
@Autowired
private UserRepository userRepository;  // JPA repository (blocking)

@Override
public Mono<GetUserServiceResponse> getUserByFiscalCode(GetUserServiceRequest request) {
    if (Strings.isNullOrEmpty(request.getFiscalCode()))
        return Mono.error(() -> new MicroServiceException(ErrorCode.FISCAL_CODE_REQUIRED.toString(), request.getClient()));

    // DB operations are always synchronous - wrap in ReactiveUtils.wrap()
    return ReactiveUtils.wrap(() -> {
                Optional<UserEntity> userOptional = userRepository.findByFiscalCode(request.getFiscalCode());

                if (!userOptional.isPresent())
                    throw new MicroServiceException(ErrorCode.USER_NOT_FOUND.toString(), request.getClient());

                return userOptional.get();
            })
            .flatMap(userEntity -> generateServiceResponseAsync(GetUserServiceResponse.class, request)
                    .map(response -> {
                        response.setUserId(userEntity.getUserId());
                        response.setFiscalCode(userEntity.getFiscalCode());
                        response.setEmail(userEntity.getEmail());
                        return response;
                    })
            );
}
```
### 3. Internal microservice call
**Use**: Call internal service using async HttpExchange clients

```java
@Autowired
private InternalServiceClientAsync internalServiceClientAsync;

@Override
public Mono<ProcessExternalServiceResponse> processExternal(ProcessExternalServiceRequest request) {
    if (Strings.isNullOrEmpty(request.getTransactionId()))
        return Mono.error(() -> new MicroServiceException(ErrorCode.TRANSACTION_ID_REQUIRED.toString(), request.getClient()));

    PayloadRequest payloadRequest = new PayloadRequest();
    payloadRequest.setTransactionId(request.getTransactionId());
    payloadRequest.setData(request.getData());

    return internalServiceClientAsync.process(payloadRequest)
        .map(ResponseEntity::getBody)  // Access body in mapping for HttpExchange clients
        .flatMap(payloadResponse -> generateServiceResponseAsync(ProcessExternalServiceResponse.class, request)
                .map(response -> {
                    response.setResult(payloadResponse.getResult());
                    response.setStatus(payloadResponse.getStatus());
                    return response;
                })
        );
}
```


### 4. Error Handling with Validation
**Use**: Comprehensive input validation and error recovery

```java
@Override
public Mono<ProcessServiceResponse> process(ProcessServiceRequest request) {
    // Multiple field validation
    if (Strings.isNullOrEmpty(request.getTransactionId()))
        return Mono.error(() -> new MicroServiceException(ErrorCode.TRANSACTION_ID_REQUIRED.toString(), request.getClient()));

    if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0)
        return Mono.error(() -> new MicroServiceException(ErrorCode.INVALID_AMOUNT.toString(), request.getClient()));

    return generateMicroSoaRestRequestAsync(request, ProcessRestRequest.class)
            .map(restRequest -> {
                BeanUtils.copyProperties(request, restRequest);
                return restRequest;
            })
            .flatMap(restClient::process)
            .onErrorResume(TimeoutException.class, ex -> {
                // Specific error handling
                logger.error("Timeout calling external service", ex);
                return Mono.error(() -> new MicroServiceException(ErrorCode.SERVICE_TIMEOUT.toString(), request.getClient()));
            })
            .flatMap(restResponse -> generateServiceResponseAsync(ProcessServiceResponse.class, request)
                    .map(response -> {
                        BeanUtils.copyProperties(restResponse, response);
                        return response;
                    })
            );
}
```

### 4b. Existing Async Client Reuse
**Use**: Add a service method that should reuse an already wired async client in the module

```java
@Override
public Mono<LookupServiceResponse> lookup(LookupServiceRequest request) {
    if (Strings.isNullOrEmpty(request.getFiscalCode()))
        return Mono.error(() -> new MicroServiceException(ErrorCode.INVALID_INPUT_DATA.toString(), request.getClient()));

    PayloadRequest payloadRequest = new PayloadRequest();
    BeanUtils.copyProperties(request, payloadRequest);
    payloadRequest.setFiscalCode(request.getFiscalCode().trim().toUpperCase(Locale.ROOT));

    return existingAsyncClient.lookup(payloadRequest)
            .flatMap(responseEntity -> Mono.justOrEmpty(responseEntity.getBody()))
            .switchIfEmpty(Mono.error(() -> new MicroServiceException(ErrorCode.DEFAULT_PT_ERROR.toString(), request.getClient())))
            .flatMap(body -> generateServiceResponseAsync(LookupServiceResponse.class, request)
                    .map(response -> {
                        response.setFound(body.getFound());
                        return response;
                    }));
}
```

### 5. Legacy Synchronous Pattern
**Use**: Legacy code (avoid for new implementations)

```java
@Override
public GetDataServiceResponse getDataSync(GetDataServiceRequest request) throws MicroServiceException {
    // Validation
    if (Strings.isNullOrEmpty(request.getDataId()))
        throw new MicroServiceException(ErrorCode.INVALID_INPUT.toString(), request.getClient());

    // Generate REST request (sync)
    GetDataRestRequest restRequest = generateMicroSoaRestRequest(request, GetDataRestRequest.class);
    BeanUtils.copyProperties(request, restRequest);

    // REST call (blocking) - returns ResponseEntity
    ResponseEntity<GetDataRestResponse> restResponse = restClient.getData(restRequest);

    // Generate service response (sync)
    GetDataServiceResponse response = generateServiceResponse(GetDataServiceResponse.class, request);
    BeanUtils.copyProperties(restResponse.getBody(), response);

    return response;
}
```

### 6. Legacy Feign Client Call (Extract Body)
**Use**: Call internal service via Feign client

```java
@Autowired
private InternalServiceClient internalServiceClient;

@Override
public Mono<ProcessExternalServiceResponse> processExternal(ProcessExternalServiceRequest request) {
    if (Strings.isNullOrEmpty(request.getTransactionId()))
        return Mono.error(() -> new MicroServiceException(ErrorCode.TRANSACTION_ID_REQUIRED.toString(), request.getClient()));

    // Feign clients are blocking - wrap in ReactiveUtils.wrap()
    return ReactiveUtils.wrap(() -> {
        PayloadRequest payloadRequest = new PayloadRequest();
        payloadRequest.setTransactionId(request.getTransactionId());
        payloadRequest.setData(request.getData());

        // Feign call (blocking) - returns ResponseEntity
        ResponseEntity<PayloadResponse> responseEntity = internalServiceClient.process(payloadRequest);
        return responseEntity.getBody();  // Extract body for Feign calls
    })
    .flatMap(payloadResponse -> generateServiceResponseAsync(ProcessExternalServiceResponse.class, request)
            .map(response -> {
                response.setResult(payloadResponse.getResult());
                response.setStatus(payloadResponse.getStatus());
                return response;
            })
    );
}
```

## Naming Conventions

```
Class:          [Entity]ServiceImpl[Client].java (e.g., UserServiceImpl, ObiServiceImplPaas)
Package:        layers.service.impl
Method:         [operationName]([Operation]ServiceRequest) -> Mono<[Operation]ServiceResponse>
DTOs:           [Operation]ServiceRequest.java, [Operation]ServiceResponse.java
REST DTOs:      [Operation]RestRequest.java, [Operation]RestResponse.java
```

## Key Methods

### generateMicroSoaRestRequestAsync()
For MT microservices calls (all clients except Paas)
```java
generateMicroSoaRestRequestAsync(serviceRequest, RestRequest.class)
    .map(restRequest -> {
        BeanUtils.copyProperties(serviceRequest, restRequest);
        return restRequest;
    })
```

### generateMTRestRequestAsync()
For MT services (ONLY for Paas client)
```java
generateMTRestRequestAsync(serviceRequest, MTRestRequest.class)
    .map(restRequest -> {
        BeanUtils.copyProperties(serviceRequest, restRequest);
        return restRequest;
    })
```

### generateAMSRestRequestAsync()
For AMS calls (auto-populates uniqueRegNumber, cardId)
```java
generateAMSRestRequestAsync(serviceRequest, AMSRestRequest.class)
    .map(restRequest -> {
        // uniqueRegNumber, cardId already set
        restRequest.setAdditionalField(serviceRequest.getField());
        return restRequest;
    })
```

### generateServiceResponseAsync()
Creates service response with context
```java
generateServiceResponseAsync(ServiceResponse.class, serviceRequest)
    .map(response -> {
        BeanUtils.copyProperties(restResponse.getBody(), response);
        return response;
    })
```

## Error Handling

```java
// Return default on error
.onErrorReturn(new DefaultResponse())

// Transform error
.onErrorMap(ex -> new MicroServiceException(ErrorCode.SERVICE_ERROR.toString(), request.getClient()))

// Type-specific
.onErrorResume(TimeoutException.class, ex -> handleTimeout())
```

## Implementation Checklist

1. Extend `NexiBaseService` for access to generators and utilities
2. Implements `[Entity]Service` interface
3. Annotate `@Service("[Entity]ServiceImpl[Client]")`
4. Method signature: `Mono<ServiceResponse> operation(ServiceRequest)`
5. Use `generateXxxRestRequestAsync()` for REST calls
6. Use `generateServiceResponseAsync()` to create response
7. Use `BeanUtils.copyProperties()` for field mapping
8. Handle errors with `onErrorResume`/`onErrorReturn`
9. Return `Mono<ServiceResponse>`
10. If a dependent module consumes this service artifact, note the required install or build step in the handoff or test notes

## Best Practices

- Use REST request generators for context propagation
- Validate inputs early (fail-fast)
- Use `Strings.isNullOrEmpty()` for string validation
- Extract body ONLY for HttpExchange and Feign calls (inside ReactiveUtils.wrap)
- Use `ReactiveUtils.wrap()` for blocking operations (Feign, DB)
- Database operations are always sync (JPA with ReactiveUtils.wrap)
- Use MicroSoa generators for all clients except Paas
- Use MT generators ONLY for Paas client
- Handle errors gracefully
- Don't use sync generators in reactive code
- Don't use `.block()` in reactive chains
- Don't manually create REST requests (use generators)
- Don't use `.map(ResponseEntity::getBody)` for REST clients

## REST Client Types

### MT Microservices (generateMicroSoaRestRequestAsync)
MiddleTier microservices - **Use for all clients except Paas**

### MT Services (generateMTRestRequestAsync)
Same as MicroSoa but **ONLY for Paas client**

### AMS (generateAMSRestRequestAsync)
Card management system - auto-populates uniqueRegNumber, cardId

### LCM (generateLCMRestRequestAsync)
Lifecycle management system

## Examples

See `references/legacy/service-async-implementing/references/`:
- `01-simple-rest-call.java` - MT microservice call (no body extraction)
- `02-ams-rest-call.java` - AMS with auto card context
- `03-database-read.java` - Sync JPA read wrapped in ReactiveUtils
- `04-feign-client.java` - Feign with body extraction
- `05-error-handling.java` - Validation and error recovery
- `06-legacy-sync.java` - Synchronous pattern

## Source Skill: `service-sync-implementing`


# Service Sync Implementation

Use this for blocking service methods that return `ServiceResponse` directly.

- Validate inputs first, usually with `Strings.isNullOrEmpty(...)`.
- Always build REST requests with `generateMicroSoaRestRequest(...)`, `generateAMSRestRequest(...)`, `generateLCMRestRequest(...)`, or `generateMTRestRequest(...)` as appropriate.
- Use `generateServiceResponse(...)` for the output and `BeanUtils.copyProperties(...)` for mapping.
- For reactive clients inside sync code, the repo uses `ReactiveUtils.await(...)`.
- See `references/legacy/service-sync-implementing/references/patterns.md` for real repo examples and legacy call styles.

## Source Skill: `rest-service-async-implementing`


# REST Service async Implementation

REST services are client interfaces for calling external microservices and APIs. Use **HttpExchange pattern** (interface-only) with configuration classes for filters and exception mapping.

## Core Principles

- **Interface-only** - Use @HttpExchange (no implementation class)
- **Reactive** - Methods return Mono<ResponseEntity<T>>
- **Base class extensions** - DTOs MUST extend system-specific base classes
- **Configuration class** - Build client with filters via ArchRestServiceSupportUtils
- **Filters** - MTServiceFilter, AMSServiceFilter, LCMServiceFilter
- **Exception mapping** - StatusCodeExceptionMapper for error translation
- **Property placeholders** - URLs from application.yml

## Base Class Extensions - REQUIRED

REST service DTOs **MUST extend** system-specific base classes:

### MT Microservices (MicroSoa)
```java
// Request DTOs extend BaseMicroSoaRestServiceRequest
public class GetDataRestServiceRequest extends BaseMicroSoaRestServiceRequest {
    private String dataId;
    private boolean includeDetails;
    // Custom fields only - base provides: username, sessionId, application, client
}

// Response DTOs extend BaseMicroSoaRestServiceResponse
public class GetDataRestServiceResponse extends BaseMicroSoaRestServiceResponse {
    private String data;
    private List<Item> items;
    // Custom fields only - base provides: result (Result object)
}
```

**Base classes provide**:
- **BaseMicroSoaRestServiceRequest**: username, sessionId, application, client (NexiClient)
- **BaseMicroSoaRestServiceResponse**: result (Result object)

### AMS (Card System)
```java
// Request DTOs extend BaseAMSRestServiceRequest
public class GetCardDetailsRestServiceRequest extends BaseAMSRestServiceRequest {
    private boolean includeTransactions;
    private String dateFrom;
    // Custom fields only - base provides: uniqueRegNumber, accountContractNumber, cardId, commercialUser, institutionId
}

// Response DTOs extend BaseAMSRestServiceResponse
public class GetCardDetailsRestServiceResponse extends BaseAMSRestServiceResponse {
    private String maskedPan;
    private BigDecimal availableBalance;
    // Custom fields only - base provides: responseStatus, responseCode (ResponseStatus objects)
}
```

**Base classes provide**:
- **BaseAMSRestServiceRequest**: uniqueRegNumber, accountContractNumber, cardId, commercialUser, institutionId
- **BaseAMSRestServiceResponse**: responseStatus, responseCode (ResponseStatus objects)

### LCM (Lifecycle Management)
```java
// Request DTOs extend BaseLCMRestServiceRequest
public class LifecycleRestServiceRequest extends BaseLCMRestServiceRequest {
    private String operationType;
    // Custom fields only - base provides LCM-specific fields
}

// Response DTOs extend BaseLCMRestServiceResponse
public class LifecycleRestServiceResponse extends BaseLCMRestServiceResponse {
    private String operationResult;
    // Custom fields only - base provides LCM-specific fields
}
```

### Base Class Matrix

| System | Request Base Class | Response Base Class | Provided Fields (Request) | Provided Fields (Response) |
|--------|-------------------|---------------------|---------------------------|----------------------------|
| MT MicroSoa | `BaseMicroSoaRestServiceRequest` | `BaseMicroSoaRestServiceResponse` | username, sessionId, application, client | result |
| AMS | `BaseAMSRestServiceRequest` | `BaseAMSRestServiceResponse` | uniqueRegNumber, accountContractNumber, cardId, commercialUser, institutionId | responseStatus, responseCode |
| LCM | `BaseLCMRestServiceRequest` | `BaseLCMRestServiceResponse` | LCM-specific | LCM-specific |

**Import Paths**:
```java
// MT MicroSoa
import it.icbpi.digitalreview.archcomps.restclient.soa.dto.BaseMicroSoaRestServiceRequest;
import it.icbpi.digitalreview.archcomps.restclient.soa.dto.BaseMicroSoaRestServiceResponse;

// AMS
import it.icbpi.digitalreview.archcomps.restclient.nets.ams.dto.BaseAMSRestServiceRequest;
import it.icbpi.digitalreview.archcomps.restclient.nets.ams.dto.BaseAMSRestServiceResponse;

// LCM
import it.icbpi.digitalreview.archcomps.restclient.nets.lcm.dto.BaseLCMRestServiceRequest;
import it.icbpi.digitalreview.archcomps.restclient.nets.lcm.dto.BaseLCMRestServiceResponse;
```

## DTO Package Structure

```
rest-domain/
└── rest-[service-name]/
    └── src/main/java/it/icbpi/digitalreview/rest/[servicename]/
        ├── [Service]RestService.java         # Interface with @HttpExchange
        ├── config/
        │   └── [Service]RestServiceConfig.java  # Configuration
        └── dto/
            ├── request/
            │   ├── [Operation]RestServiceRequest.java     # extends BaseMicroSoaRestServiceRequest
            │   └── [Operation]AnotherRestServiceRequest.java  # extends BaseAMSRestServiceRequest
            ├── response/
            │   ├── [Operation]RestServiceResponse.java    # extends BaseMicroSoaRestServiceResponse
            │   └── [Operation]AnotherRestServiceResponse.java # extends BaseAMSRestServiceResponse
            └── domain/
                ├── UserData.java          # Shared domain objects (NO base class)
                ├── CardInfo.java          # Used in request/response
                └── TransactionDetail.java # Nested objects
```

**DTO Guidelines**:
- **request/** - Request DTOs extending system-specific base (BaseMicroSoaRestServiceRequest, BaseAMSRestServiceRequest, etc.)
- **response/** - Response DTOs extending system-specific base (BaseMicroSoaRestServiceResponse, BaseAMSRestServiceResponse, etc.)
- **domain/** - Shared objects used in both request and response (nested objects, enums, value objects) - **NO base class extension**

**When to use domain/ Package**:

Put in domain/ when:
- Object used in BOTH request and response
- Nested complex object referenced multiple times
- Enums, value objects, common data structures
- Business domain entities shared across operations

**Examples**:
```java
// request/CreateUserRestServiceRequest.java (MT)
public class CreateUserRestServiceRequest extends BaseMicroSoaRestServiceRequest {
    private UserInfo userInfo;        // From domain/
    private Address address;          // From domain/
    private List<CardData> cards;     // From domain/
    // Base provides: username, sessionId, application, client
}

// response/CreateUserRestServiceResponse.java (MT)
public class CreateUserRestServiceResponse extends BaseMicroSoaRestServiceResponse {
    private UserInfo userInfo;        // Same from domain/
    private PaymentStatus status;     // Enum from domain/
    // Base provides: result
}

// request/GetCardDetailsRestServiceRequest.java (AMS)
public class GetCardDetailsRestServiceRequest extends BaseAMSRestServiceRequest {
    private boolean includeTransactions;
    // Base provides: uniqueRegNumber, accountContractNumber, cardId, commercialUser, institutionId
}

// response/GetCardDetailsRestServiceResponse.java (AMS)
public class GetCardDetailsRestServiceResponse extends BaseAMSRestServiceResponse {
    private String maskedPan;
    private BigDecimal balance;
    // Base provides: responseStatus, responseCode
}

// domain/UserInfo.java (shared object - NO base class extension)
public class UserInfo {
    private String fiscalCode;
    private String email;
    private String phoneNumber;
}
```

## Patterns

### 1. HttpExchange Interface - RECOMMENDED
**Use**: All new REST service clients

```java
package it.icbpi.digitalreview.rest.servicename;

import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;
import org.springframework.http.ResponseEntity;

import static it.icbpi.digitalreview.projectdependencies.utils.constants.RequestAttributeConstants.REQUEST;

@HttpExchange
public interface [Service]RestService {

    @GetExchange(url = "${[service].getData.endpoint}")
    Mono<ResponseEntity<GetDataResponse>> getData(
        @RequestAttribute(REQUEST) GetDataRequest request,
        @RequestParam("id") String id
    );

    @PostExchange(url = "${[service].create.endpoint}")
    Mono<ResponseEntity<CreateResponse>> create(
        @RequestAttribute(REQUEST) CreateRequest request,
        @RequestBody CreateRequestBody body
    );

    @PostExchange(url = "${[service].process.endpoint}")
    Mono<ResponseEntity<ProcessResponse>> process(
        @RequestAttribute(REQUEST) BaseRequest request
    );
}
```

### 2. Configuration Class with Filters - REQUIRED
**Use**: Create bean with filters and exception mapping

```java
package it.icbpi.digitalreview.rest.servicename.config;

import it.icbpi.digitalreview.archcomps.restclient.soa.filters.MTServiceFilter;
import it.icbpi.digitalreview.archcomps.restclient.soa.filters.support.ArchRestServiceSupportUtils;
import it.icbpi.digitalreview.archcomps.restclient.soa.jwt.JwtHandlerFactory;
import it.icbpi.digitalreview.archcomps.utils.http.HttpUtils;
import it.icbpi.digitalreview.rest.servicename.ServiceRestService;
import it.icbpi.digitalreview.rest.servicename.config.mapper.MTStatusCodeExceptionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

import static it.icbpi.digitalreview.archcomps.restclient.soa.filters.support.ArchRestServiceSupportUtils.buildRestExceptionMapperFilter;

@Configuration
public class ServiceRestServiceConfig {

    @Bean
    public ServiceRestService serviceRestService(
            @Autowired JwtHandlerFactory jwtHandlerFactory,
            @Autowired HttpUtils httpUtils,
            @Autowired ArchRestServiceSupportUtils utils) {

        return utils.buildHttpExchangeClient(
            ServiceRestService.class,
            List.of(new MTServiceFilter(jwtHandlerFactory, httpUtils)),
            buildRestExceptionMapperFilter(new MTStatusCodeExceptionMapper())
        );
    }
}
```

### 3. Legacy Implementation Class (Avoid)
**Use**: Maintaining old code only

```java
@Service("ServiceRestServiceImpl")
public class ServiceRestServiceImpl implements ServiceRestService {

    @Autowired
    private WebClient webClient;

    @Override
    public Mono<ResponseEntity<GetDataResponse>> getData(GetDataRequest request, String id) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/data")
                        .queryParam("id", id)
                        .build())
                .header("Authorization", "Bearer " + request.getToken())
                .retrieve()
                .toEntity(GetDataResponse.class);
    }
}
```

## Naming Conventions

```
Module:         rest-[service-name] (e.g., rest-issuing-k6, rest-iam, rest-obi)
Interface:      [Service]RestService.java
Config:         [Service]RestServiceConfig.java
Exception Mapper: [System]StatusCodeExceptionMapper.java (MT, AMS, LCM)
DTOs:           dto/request/[Operation]RestServiceRequest.java
                dto/response/[Operation]RestServiceResponse.java
                dto/domain/[DomainObject].java
```

## Filters by System

| System | Filter Class     | Use For |
|--------|------------------|---------|
| MT Microservices | MicroSoaFilter   | MT microservices (all clients except Paas) |
| MT Services (Paas) | MTServiceFilter  | Same as above but for Paas only |
| AMS | AMSServiceFilter | Card management system |
| LCM | LCMServiceFilter | Lifecycle management |

## Annotations

### Interface Annotations
```java
@HttpExchange                           // Marks REST service interface
@GetExchange(url = "${property}")       // GET mapping
@PostExchange(url = "${property}")      // POST mapping
@PutExchange(url = "${property}")       // PUT mapping
@DeleteExchange(url = "${property}")    // DELETE mapping
@PatchExchange(url = "${property}")     // PATCH mapping
```

### Parameter Annotations
```java
@RequestAttribute(REQUEST)              // Pass request context
@RequestParam("name")                   // Query parameter
@PathVariable("id")                     // Path variable
@RequestBody                            // Request body
@RequestHeader("Header-Name")           // HTTP header
```

## Implementation Checklist

1. Create interface with `@HttpExchange`
2. Define methods returning `Mono<ResponseEntity<T>>`
3. Use `@GetExchange`/`@PostExchange` with property placeholders
4. Add `@RequestAttribute(REQUEST)` for base request
5. Create DTOs in `dto/request`, `dto/response`, `dto/domain` packages
6. Create configuration class with `@Configuration`
7. Create `@Bean` using `ArchRestServiceSupportUtils.buildHttpExchangeClient()`
8. Add appropriate filter (MTServiceFilter, AMSServiceFilter, LCMServiceFilter)
9. Add exception mapper filter
10. Configure endpoints in `application.yml`

## Best Practices

- Use HttpExchange pattern (interface-only)
- Return `Mono<ResponseEntity<T>>`
- **ALWAYS extend base classes**: MT -> BaseMicroSoa*, AMS -> BaseAMS*, LCM -> BaseLCM*
- Use property placeholders for URLs (`${external.service.endpoint}`)
- Always include `@RequestAttribute(REQUEST)` for base request
- Put domain objects in `dto/domain` package (no base class)
- Separate request/response DTOs in dedicated packages
- Use appropriate filter (MT, AMS, LCM)
- Add exception mapper for error handling
- Don't create implementation classes (use HttpExchange)
- Don't hardcode URLs in annotations
- Don't return unwrapped types (always ResponseEntity)
- Don't forget REQUEST attribute
- Don't create DTOs without extending base classes
- Don't put base class extensions on domain/ objects

## Examples

See `references/legacy/rest-service-async-implementing/references/`:
- `01-httpexchange-interface.java` - Basic HttpExchange interface
- `02-mt-config.java` - Configuration with MicroSoaFilter
- `03-dto-structure/` - DTO package organization example
- `04-legacy-impl.java` - Legacy WebClient implementation (avoid)

## Source Skill: `rest-service-sync-implementing`


# REST Service Sync Implementation

Use this for the repo's blocking REST clients and legacy client implementations.

- Keep interface contracts explicit and DTO-driven.
- Implementations usually extend `ArchRestServiceSupportImpl` or `AMSArchRestServiceSupportImpl`.
- Build headers and bodies manually, then call `exchangeOkOrFail(...)`.
- Return `ResponseEntity.getBody()` or a mapped DTO, depending on the contract.
- Always update the related interface before implementing any REST service method.
- See `references/legacy/rest-service-sync-implementing/references/patterns.md` for the actual repo shapes and exception-mapper conventions.

## Source Skill: `facade-async-implementing`


# Facade Async Implementation

Facades contain business logic and orchestrate service calls. They transform controller requests into service requests, call services, merge responses, and handle errors.

## Core Principles

- **Business logic** - Validation, conditional flows, state machines
- **Service orchestration** - Call services via generateServiceRequestAsync()
- **NexiUserInterface async** - Always use async methods (e.g. getUserInfoAsync, getCardInfoAsync)
- **Response merging** - Combine multiple service responses with Mono.zip()
- **Error handling** - onErrorResume, onErrorReturn for graceful recovery
- **BeanUtils.copyProperties** - Transfer fields between DTOs

## Standard Flow

```
1. generateServiceRequestAsync() -> Create service request with context
2. Service calls -> Call one or multiple services
3. Merge responses -> Mono.zip() for parallel calls
4. generateFacadeResponseAsync() -> Create facade response
5. BeanUtils.copyProperties() -> Map fields
6. Return Mono<FacadeResponse>
```

## Patterns

### 1. Simple Service Call - BASIC
**Use**: Single service call with direct mapping

```java
@Override
public Mono<[Operation]FacadeResponse> [operationName]([Operation]FacadeRequest request) {
    return generateServiceRequestAsync(request, [Operation]ServiceRequest.class)
            .flatMap(serviceRequest -> {
                // Set request-specific fields
                serviceRequest.setField(request.getField());
                return [service].[operationName](serviceRequest);
            })
            .flatMap(serviceResponse ->
                generateFacadeResponseAsync([Operation]FacadeResponse.class, request)
                    .map(facadeResponse -> {
                        BeanUtils.copyProperties(serviceResponse, facadeResponse);
                        // custom mapping if needed
                        return facadeResponse;
                    })
            );
}
```

### 2. Multiple Parallel Service Calls - COMMON
**Use**: Call multiple services in parallel with Mono.zip()

```java
@Override
public Mono<[Operation]FacadeResponse> [operationName]([Operation]FacadeRequest request) {
    Mono<Service1Response> call1 = generateServiceRequestAsync(request, [Operation]ServiceRequest.class)
        .map(r->{
            // Prepare service request for call1
            r.setField1(request.getField1());
            return r;
        })
        .flatMap(service::getData);

    Mono<Service2Response> call2 = generateServiceRequestAsync(request, [Operation]ServiceRequest.class)
        .map(r->{
            // Prepare service request for call1
            r.setField1(request.getField1());
            return r;
        })
        .flatMap(service::getInfo);

    return Mono.zip(call1, call2)
            .flatMap(tuple ->
                generateFacadeResponseAsync([Operation]FacadeResponse.class, request)
                    .map(facadeResponse -> {
                        // Merge responses
                        BeanUtils.copyProperties(tuple.getT1(), facadeResponse);
                        facadeResponse.setAdditionalInfo(tuple.getT2().getInfo());
                        return facadeResponse;
                    })
            );
    });
}
```

### 3. User Context with Async Methods
**Use**: Access user data using NexiUserInterface async methods

```java
@Override
public Mono<[Operation]FacadeResponse> [operationName]([Operation]FacadeRequest request) {
    NexiUserInterface loggedUser = request.getLoggedUser();

    return Mono.zip(
                loggedUser.getUserInfoAsync(),
                loggedUser.getCardInfoAsync(request.getCardId()),
                generateServiceRequestAsync(request, [Operation]ServiceRequest.class)
            )
            .map(tuple -> {
                UserInfo userInfo = tuple.getT1();
                CardInfo cardInfo = tuple.getT2();
                [Operation]ServiceRequest serviceRequest = tuple.getT3();

                // Use user context
                serviceRequest.setFiscalCode(userInfo.getFiscalCode());
                serviceRequest.setPan(cardInfo.getGeneralData().getPan());

                return serviceRequest;
            })
            .flatMap([service]::[operationName])
            .flatMap(serviceResponse ->
                generateFacadeResponseAsync([Operation]FacadeResponse.class, request)
                    .map(facadeResponse -> {
                        BeanUtils.copyProperties(serviceResponse, facadeResponse);
                        return facadeResponse;
                    })
            );
}
```

### 4. Sequential Dependent Calls
**Use**: Second call depends on first call result

```java
@Override
public Mono<[Operation]FacadeResponse> [operationName]([Operation]FacadeRequest request) {
    return generateServiceRequestAsync(request, [Operation]ServiceRequest.class)
            .flatMap(service1::getInitialData)
            .flatMap(initialResponse -> {
                // Use first response in second call
                return generateServiceRequestAsync(request, Service2Request.class)
                        .flatMap(service2Request -> {
                            service2Request.setDataFromPrevious(initialResponse.getData());
                            return service2.processData(service2Request);
                        });
            })
            .flatMap(finalResponse ->
                generateFacadeResponseAsync([Operation]FacadeResponse.class, request)
                    .map(facadeResponse -> {
                        BeanUtils.copyProperties(finalResponse, facadeResponse);
                        return facadeResponse;
                    })
            );
}
```

### 5. List Transformation
**Use**: Transform collections with stream operations

```java
@Override
public Mono<[Operation]FacadeResponse> [operationName]([Operation]FacadeRequest request) {
    return generateServiceRequestAsync(request, [Operation]ServiceRequest.class)
            .flatMap(serviceRequest -> [service].getList(serviceRequest))
            .flatMap(serviceResponse ->
                generateFacadeResponseAsync([Operation]FacadeResponse.class, request)
                    .map(facadeResponse -> {
                        // Transform list
                        List<FacadeItem> facadeItems = serviceResponse.getItems().stream()
                                .map(serviceItem -> {
                                    FacadeItem facadeItem = new FacadeItem();
                                    BeanUtils.copyProperties(serviceItem, facadeItem);
                                    // Custom transformations
                                    facadeItem.setEnriched(processItem(serviceItem));
                                    return facadeItem;
                                })
                                .collect(Collectors.toList());

                        facadeResponse.setItems(facadeItems);
                        return facadeResponse;
                    })
            );
}
```

## Naming Conventions

```
Class:          [Entity]Facade[Client].java (e.g., ObiFacadePaas, UserFacadeDefault)
Package:        layers.facade.impl
Method:         [operationName]([Operation]FacadeRequest) -> Mono<[Operation]FacadeResponse>
DTOs:           [Operation]FacadeRequest.java, [Operation]FacadeResponse.java
```

## Key Methods

### generateServiceRequest()
Creates service request with auto-populated context
```java
generateServiceRequest(facadeRequest, ServiceRequest.class)
    .flatMap(serviceRequest -> {
        // Add custom fields
        serviceRequest.setSpecificField(facadeRequest.getField());
        return service.call(serviceRequest);
    })
```

### generateFacadeResponse()
Creates facade response with base context
```java
generateFacadeResponse(FacadeResponse.class, facadeRequest)
    .map(facadeResponse -> {
        BeanUtils.copyProperties(serviceResponse, facadeResponse);
        return facadeResponse;
    })
```

### NexiUserInterface Async Methods
```java
NexiUserInterface loggedUser = request.getLoggedUser();

loggedUser.getUserInfoAsync()                           // Mono<UserInfo>
loggedUser.getCardInfoAsync(cardId)                     // Mono<CardInfo>
loggedUser.getCurrentCommercialCardInfoAsync()          // Mono<CardInfo>
loggedUser.getCardBusinessProfilingAsync()              // Mono<CardBusinessProfiling>
loggedUser.getOperativitaAsync()                        // Mono<Operativita>
```

## Merging Patterns

### Mono.zip() - Parallel Execution
```java
Mono.zip(
    service1.call(request),
    service2.call(request)
).flatMap(tuple -> {
    Response1 r1 = tuple.getT1();
    Response2 r2 = tuple.getT2();
    // Merge logic
})
```

## Error Handling

```java
// Return default on error
.onErrorReturn(new DefaultResponse())

// Resume with alternative
.onErrorResume(ex -> fallbackMono)

// Transform error
.onErrorMap(ex -> new MicroServiceException(ErrorCode.SPECIFIC_ERROR.toString(), request.getClient()))

// Type-specific
.onErrorResume(TimeoutException.class, ex -> fallbackMono)
```

## Implementation Checklist

1. Extend `FacadeBase`
2. Annotate `@Service("[Entity]Facade[Client]")`
3. Method signature: `Mono<FacadeResponse> operation(FacadeRequest)`
4. Use `generateServiceRequestAsync()` to create service requests
5. Use `NexiUserInterface` async methods for user context
6. Use `Mono.zip()` for parallel service calls
7. Use `generateFacadeResponseAsync()` to create response
8. Use `BeanUtils.copyProperties()` for field mapping
9. Handle errors with `onErrorResume`/`onErrorReturn`
10. Return `Mono<FacadeResponse>`

## Best Practices

- Use `generateServiceRequestAsync()` for context propagation
- Use `NexiUserInterface` async methods (never sync)
- Use `Mono.zip()` for parallel independent calls
- Use `BeanUtils.copyProperties()` for DTO mapping
- Chain with `.flatMap()` for async operations
- Handle errors gracefully with `onErrorResume`
- Validate inputs early
- Use descriptive variable names
- Don't use `loggedUser.getUserInfo()` (sync - use async)
- Don't use `.block()` in reactive chains
- Don't manually copy context fields

## Examples

See `references/legacy/facade-async-implementing/references/`:
- `01-simple-service-call.java` - Basic pattern
- `02-parallel-calls.java` - Mono.zip() pattern
- `03-user-context.java` - NexiUserInterface async methods
- `04-list-transformation.java` - Stream operations

## Source Skill: `facade-sync-implementing`


# Facade Sync Implementation

Use this for blocking facade methods that return `FacadeResponse` directly.

- Build service requests with `generateServiceRequest(...)`.
- Keep business rules, state-machine transitions, and response merging in the facade.
- Use `BeanUtils.copyProperties(...)` for routine DTO transfer.
- Use `generateFacadeResponse(...)` to create the output and preserve context.
- See `references/legacy/facade-sync-implementing/references/patterns.md` for codebase examples and recurring sync flows.

## Source Skill: `enricher-async-implementing`


# Enricher Async Implementation

Enrichers pull data from session storage and inject it into facade requests. They bridge controller and facade layers by enriching requests with temporary session data.

## Purpose

- **Session retrieval** - Pull previously saved data from session
- **Request enrichment** - Populate facade request fields

## Core Principles

- **Extend EnrichImpl** - Base class provides session manager
- **Type-safe** - Generic type matches facade request: `EnrichImpl<[Operation]FacadeRequest>`
- **Reactive-first** - Implement `enrichRequestFromSessionAsync()` for new code
- **Fail-fast** - Throw exceptions if required session data missing
- **Stateless** - Don't store state in enricher fields

## Standard Flow

```
1. Retrieve from session (getAsync/getOrFailAsync)
2. Validate data (check nulls/empty)
3. Populate facade request fields
4. Return enriched request (or error)
```

## Patterns

### 1. Reactive Single Retrieval - SIMPLE
**Use**: Retrieve one item from session

```java
@Lazy
@Component("[Operation]EnricherDefault")
public class [Operation]EnricherDefault extends EnrichImpl<[Operation]FacadeRequest> {

    private static final String SESSION_KEY = "KEY_NAME";

    @Override
    public Mono<[Operation]FacadeRequest> enrichRequestFromSessionAsync([Operation]FacadeRequest source) {
        return nexiSessionManager.getAsync(SESSION_KEY)
                .defaultIfEmpty(new DefaultObject())
                .cast(DataType.class)
                .flatMap(data -> {
                    if (data == null || data.isEmpty())
                        return Mono.error(new MicroServiceException(ErrorCode.SESSION_EXPIRED, source.getClient()));
                    source.setData(data);
                    return super.enrichRequestFromSessionAsync(source);
                });
    }
}
```

### 2. Reactive Multiple Retrieval - RECOMMENDED
**Use**: Retrieve multiple items in parallel with `Mono.zip()`

```java
@Lazy
@Component("[Operation]EnricherDefault")
public class [Operation]EnricherDefault extends EnrichImpl<[Operation]FacadeRequest> {

    private static final String KEY_1 = "FIRST_KEY";
    private static final String KEY_2 = "SECOND_KEY";

    @Override
    public Mono<[Operation]FacadeRequest> enrichRequestFromSessionAsync([Operation]FacadeRequest source) {
        Mono<DataType1> data1 = nexiSessionManager.getAsync(KEY_1).defaultIfEmpty(new DataType1()).cast(DataType1.class);
        Mono<DataType2> data2 = nexiSessionManager.getAsync(KEY_2).defaultIfEmpty(new DataType2()).cast(DataType2.class);

        return Mono.zip(data1, data2)
                .flatMap(tuple -> {
                    source.setField1(tuple.getT1());
                    source.setField2(tuple.getT2());

                    // Validation
                    if (tuple.getT1().isEmpty() && tuple.getT2().isEmpty())
                        return Mono.error(new UnauthorisedMicroServiceException(
                            ArchErrorCode.SESSION_EXPIRED, source.getClient(), null, HttpStatus.UNAUTHORIZED));

                    return super.enrichRequestFromSessionAsync(source);
                });
    }
}
```

### 3. Reactive with getOrFailAsync
**Use**: Fail immediately if session data missing (strict validation)

```java
@Lazy
@Component("[Operation]EnricherDefault")
public class [Operation]EnricherDefault extends EnrichImpl<[Operation]FacadeRequest> {

    @Override
    public Mono<[Operation]FacadeRequest> enrichRequestFromSessionAsync([Operation]FacadeRequest source) {
        return Mono.zip(
                nexiSessionManager.getOrFailAsync(StateMachine.class),
                nexiSessionManager.getOrFailAsync(FlowInfo.class),
                (stateMachine, flowInfo) -> {
                    source.setStateMachine(stateMachine);
                    source.setFlowInfo(flowInfo);
                    return source;
                }
        );
    }
}
```

### 4. Synchronous (Legacy - Avoid)
**Use**: Legacy code or blocking operations

```java
@Lazy
@Component("[Operation]EnricherDefault")
public class [Operation]EnricherDefault extends EnrichImpl<[Operation]FacadeRequest> {

    private static final String SESSION_KEY = "DATA_KEY";

    @Override
    public [Operation]FacadeRequest enrichRequestFromSession([Operation]FacadeRequest source) throws MicroServiceException {
        DataType data = nexiSessionManager.get(SESSION_KEY);

        if (data == null || data.isEmpty()) {
            throw new MicroServiceException(ErrorCode.SESSION_EXPIRED, source.getClient());
        }

        source.setData(data);
        source.setStateMachine(nexiSessionManager.getOrFail(StateMachine.class));
        return source;
    }
}
```

### 5. Empty Enricher (Placeholder)
**Use**: When client-specific override needed but default does nothing

```java
@Lazy
@Component("[Operation]EnricherDefault")
public class [Operation]EnricherDefault extends EnrichImpl<[Operation]FacadeRequest> {
    // Empty - client-specific enrichers extend this
}
```

## Naming Conventions

```
Class:          [Operation]Enricher[Client].java
Package:        layers.controller.enricher (or layers.controller.enrich)
Default:        [Operation]EnricherDefault
Client-specific: [Operation]EnricherMPS, [Operation]EnricherPT, etc.
```

## Session Manager Methods

| Method | Use Case | Behavior |
|--------|----------|----------|
| `getAsync(key)` | Optional data | Returns `Mono.empty()` if not found |
| `getOrFailAsync(Class)` | Required data | Throws exception if not found |
| `get(key)` | Sync optional | Returns `null` if not found |
| `getOrFail(Class)` | Sync required | Throws exception if not found |

## Operator Guide

| Operator | Use | Example |
|----------|-----|---------|
| `.defaultIfEmpty()` | Provide fallback | `.defaultIfEmpty(new DataType())` |
| `.cast()` | Type casting | `.cast(String.class)` |
| `Mono.zip()` | Parallel retrieval | `Mono.zip(mono1, mono2, (a, b) -> {...})` |
| `.flatMap()` | Async validation | `.flatMap(data -> validate(data))` |

## Decision Matrix

| Scenario | Pattern | Key Method |
|----------|---------|------------|
| Single session item | 1 | `getAsync()` + `defaultIfEmpty()` |
| Multiple items parallel | 2 | `Mono.zip()` with multiple `getAsync()` |
| Strict validation | 3 | `getOrFailAsync()` |
| Legacy/blocking | 4 | `get()` / `getOrFail()` |
| Placeholder | 5 | Empty class |

## Common Patterns

### Safe Defaults
```java
Mono<String> value = nexiSessionManager.getAsync(KEY)
    .defaultIfEmpty("")  // Empty string instead of empty mono
    .cast(String.class);
```

## Implementation Checklist

1. Extend `EnrichImpl<[Operation]FacadeRequest>`
2. Annotate `@Lazy` + `@Component("[Operation]Enricher[Client]")`
3. Define session keys as `private static final String`
4. Override `enrichRequestFromSessionAsync()` for reactive
5. Use `Mono.zip()` for multiple parallel retrievals
6. Use `.defaultIfEmpty()` for safe defaults
7. Validate retrieved data (null/empty checks)
8. Set fields on `source` object
9. Call `super.enrichRequestFromSessionAsync(source)` at end
10. Return `Mono.error()` for validation failures

## Best Practices

- Use reactive methods (`enrichRequestFromSessionAsync`)
- `Mono.zip()` for parallel retrieval
- `.defaultIfEmpty()` before `.cast()`
- Validate data after retrieval
- Throw typed exceptions (UnauthorisedMicroServiceException for session expiry)
- Call `super.enrichRequestFromSessionAsync()` at end
- Use `getOrFailAsync()` for strict requirements
- Don't store state in enricher fields
- Don't modify payload request (only facade request)
- Don't use `.block()` in reactive methods

## Client-Specific Override

```java
// Default
@Component("CheckInputEnricherDefault")
public class CheckInputEnricherDefault extends EnrichImpl<CheckInputFacadeRequest> {
    // Base logic
}

// Client-specific
@Component("CheckInputEnricherCoBa")
public class CheckInputEnricherCoBa extends CheckInputEnricherDefault {
    @Override
    public Mono<CheckInputFacadeRequest> enrichRequestFromSessionAsync(CheckInputFacadeRequest source) {
        // CoBa-specific enrichment
        return Mono.zip(
            nexiSessionManager.getOrFailAsync(StateMachineCoBa.class),
            nexiSessionManager.getOrFailAsync(InfoCoBa.class),
            (sm, info) -> {
                source.setStateMachine(sm);
                source.setInfo(info);
                return source;
            }
        );
    }
}
```

## Examples

See `references/legacy/enricher-async-implementing/references/`:
- `01-simple-single-retrieval.java` - Single item with validation
- `02-multiple-parallel.java` - Multiple items with Mono.zip (UpdateContactEnrichDefault)
- `03-getorfail.java` - Strict validation with getOrFailAsync
- `04-client-specific.java` - Client override pattern
- `05-sync-legacy.java` - Synchronous pattern
- `06-empty-placeholder.java` - Empty enricher

## Error Handling

### Session Expired
```java
return Mono.error(() -> new UnauthorisedMicroServiceException(
    ArchErrorCode.SESSION_EXPIRED.toString(),
    source.getClient(),
    null,
    HttpStatus.UNAUTHORIZED
));
```

### Missing Required Data
```java
if (data == null || Strings.isNullOrEmpty(data.getValue()))
    return Mono.error(()->new MicroServiceException(
        ErrorCode.MISSING_SESSION_DATA,
        source.getClient()
    ));
```

### getOrFailAsync (automatic)
```java
// Throws SessionDataNotFoundException if not found
nexiSessionManager.getOrFailAsync(RequiredData.class)
```

## Source Skill: `enricher-sync-implementing`


# Enricher Sync Implementation

Use this for blocking enrichers that mutate a facade request in place.

- Extend `EnrichImpl<T>` and annotate with `@Lazy` plus `@Component(...)`.
- Pull data with `nexiSessionManager.get(...)` or `nexiSessionManager.getOrFail(...)`.
- Keep the method focused on session read and request mutation.
- Use `enrichRequestModify(...)` only for small follow-up mutations already used by the repo.
- See `references/legacy/enricher-sync-implementing/references/patterns.md` for examples and session-key conventions.

## Source Skill: `mapper-async-implementing`


# Mapper Async Implementation

Mappers transform facade responses to payload responses (controller DTOs) and persist relevant data to session for subsequent requests. They bridge the facade and controller layers.

## Purpose

- **DTO transformation** - Map facade response to payload response
- **Session persistence** - Save data for multi-step flows
- **Data enrichment** - Add session data during transformation
- **Field mapping** - BeanUtils.copyProperties + custom logic

## Core Principles

- **Extend PayloadResponseMapper** - Generic types: `PayloadResponseMapper<FacadeResponse, PayloadResponse>`
- **Reactive-first** - Implement `mapAsync()` and `saveInSessionAsync()`
- **Separation of concerns** - Transform in `mapAsync()`, persist in `saveInSessionAsync()`
- **Stateless** - Don't store state in mapper fields

## Standard Flow
```
1. saveInSessionAsync() -> Persist to session (if needed)
2. mapAsync() -> Transform facade -> payload response
3. super.mapSource() / super.saveInSessionAsync() -> Base processing
```

## Patterns

### 1. Simple Reactive Transformation - BASIC
**Use**: Basic DTO mapping without session operations

```java
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapper")
public class [Operation]PayloadResponseFromFacadeMapper extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {

    @Override
    public Mono<[Operation]PayloadResponse> mapAsync(Mono<[Operation]FacadeResponse> source) {
        return source
                .map(s -> {
                    [Operation]PayloadResponse target = super.mapSource(s);
                    // Custom field mapping
                    target.setField1(s.getField1());
                    target.setField2(s.getField2());
                    return target;
                });
    }
}
```

### 2. Reactive with Session Save - COMMON
**Use**: Save facade response data to session

```java
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapper")
public class [Operation]PayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {

    @Override
    public Mono<[Operation]FacadeResponse> saveInSessionAsync(Mono<[Operation]FacadeResponse> source) {
        return source.flatMap(s -> {
                    if (s.getStateMachine() != null)
                        return nexiSessionManager.putAsync(s.getStateMachine())
                                .then(super.saveInSessionAsync(Mono.just(s)));
                    return super.saveInSessionAsync(Mono.just(s));
                });
    }

    @Override
    public Mono<[Operation]PayloadResponse> mapAsync(Mono<[Operation]FacadeResponse> source) {
        return source
                .map(s -> {
                    [Operation]PayloadResponse target = super.mapSource(s);
                    target.setField(s.getField());
                    return target;
                });
    }
}
```

### 3. Reactive with Multiple Session Saves
**Use**: Save multiple objects to session with `Mono.when()`

```java
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapper")
public class [Operation]PayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {

    @Override
    public Mono<[Operation]FacadeResponse> saveInSessionAsync(Mono<[Operation]FacadeResponse> source) {
        return source.flatMap(s -> {
            Mono<Void> saveStateMachine;
            if (s.getStateMachine() != null)
                saveStateMachine = nexiSessionManager.putAsync(s.getStateMachine());
            else
                saveStateMachine = Mono.empty();
            Mono<Void> saveFlowInfo = nexiSessionManager.putAsync(s.getFlowInfo());

            return Mono.when(saveStateMachine, saveFlowInfo)
                    .then(super.saveInSessionAsync(Mono.just(s)));
        });
    }
}
```

### 4. Reactive with Session Retrieval During Mapping - ADVANCED
**Use**: Get session data during transformation (GetCardInfoAllFromFacadeMapper pattern)

```java
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapper")
public class [Operation]PayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {

    @Override
    public Mono<[Operation]PayloadResponse> mapAsync(Mono<[Operation]FacadeResponse> source) {
        return source.flatMap(s -> {
            [Operation]PayloadResponse target = super.mapSource(s);

            // Retrieve session data during mapping
            Mono<SessionData> sessionDataMono = nexiSessionManager.getAsync(SESSION_KEY);

            return sessionDataMono.mapNotNull(sessionData -> {
                // Transform using both facade response and session data
                if (target.getItems() != null && !target.getItems().isEmpty()) {
                    List<Item> enrichedItems = target.getItems().stream()
                            .map(item -> {
                                item.setEnrichedField(sessionData.get(item.getId()));
                                return item;
                            })
                            .collect(Collectors.toList());
                    target.setItems(enrichedItems);
                }
                return target;
            })
            .defaultIfEmpty(target);  // If session data is missing, return target without enrichment;
        });
    }

    @Override
    public Mono<[Operation]FacadeResponse> saveInSessionAsync(Mono<[Operation]FacadeResponse> source) {
        return source
                .flatMap(s -> nexiSessionManager.putAsync(s.getData())
                    .then(super.saveInSessionAsync(Mono.just(s)))
                );
    }
}
```

### 5. Conditional Session Save
**Use**: Save to session based on configuration flag

```java
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapper")
public class [Operation]PayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {

    @Value("${ark.nexiUser.session:true}")
    protected boolean nexiUserInSession;

    @Override
    public Mono<[Operation]FacadeResponse> saveInSessionAsync(Mono<[Operation]FacadeResponse> source) {
        if (nexiUserInSession)
            return source
                    .flatMap(s -> nexiSessionManager.putAsync(s.getLoggedUser())
                        .then(super.saveInSessionAsync(Mono.just(s)))
                    );
        return super.saveInSessionAsync(source);
    }
}
```

### 6. Client-Specific Override
**Use**: Different mapping/session logic per client

```java
// Default
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapperDefault")
public class [Operation]PayloadResponseFromFacadeMapperDefault
    extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {
    // Base logic
}

// Client-specific (PT)
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapperPt")
public class [Operation]PayloadResponseFromFacadeMapperPt extends [Operation]PayloadResponseFromFacadeMapperDefault {

    @Override
    public Mono<[Operation]FacadeResponse> saveInSessionAsync(Mono<[Operation]FacadeResponse> source) {
        return source
                .flatMap(s -> {
                    // PT-specific session save
                    return PtUtil.saveWebDataAsync(s, nexiSessionManager)
                        .then(super.saveInSessionAsync(Mono.just(s)));
                });
    }
}
```

### 7. Synchronous (Legacy)
**Use**: Legacy code (avoid for new implementations)

```java
@Lazy
@Component("[Operation]PayloadResponseFromFacadeMapper")
public class [Operation]PayloadResponseFromFacadeMapper
    extends PayloadResponseMapper<[Operation]FacadeResponse, [Operation]PayloadResponse> {

    @Override
    public void saveInSession([Operation]FacadeResponse source) {
        if (source.getStateMachine() != null)
            nexiSessionManager.put(source.getStateMachine());
        nexiSessionManager.put(source.getFlowInfo());
    }

    @Override
    public [Operation]PayloadResponse map([Operation]FacadeResponse source) {
        [Operation]PayloadResponse target = super.map(source);
        target.setField(source.getField());
        return target;
    }
}
```

## Naming Conventions

```
Class:          [Operation]PayloadResponseFromFacadeMapper[Client].java
Package:        layers.controller.mapper (or layers.controller.mapper.response)
Default:        [Operation]PayloadResponseFromFacadeMapper or ...Default
Client-specific: [Operation]PayloadResponseFromFacadeMapperPt, ...MPS, etc.
Generic types:   PayloadResponseMapper<FacadeResponse, PayloadResponse>
```

## Session Manager Methods

| Method | Use Case | Return |
|--------|----------|--------|
| `putAsync(Object)` | Save single object | `Mono<Void>` |
| `putAsync(String key, Object)` | Save with custom key | `Mono<Void>` |
| `getAsync(String key)` | Retrieve by key | `Mono<Object>` |
| `put(Object)` | Sync save | `void` |
| `get(String key)` | Sync retrieve | `Object` |

## Operator Guide

| Operator | Use | Example |
|----------|-----|---------|
| `.flatMap()` | Async operations | `.flatMap(s -> putAsync(s.getData()))` |
| `.then()` | Chain ignoring result | `.then(super.saveInSessionAsync(source))` |
| `Mono.when()` | Multiple parallel saves | `Mono.when(save1, save2).then(super)` |
| `.mapNotNull()` | Transform non-null | `.mapNotNull(data -> enrichItem(data))` |

## Decision Matrix

| Scenario | Pattern | Key Method |
|----------|---------|------------|
| Basic mapping | 1 | `mapAsync()` with super |
| Save to session | 2 | `saveInSessionAsync()` + `putAsync()` |
| Multiple saves | 3 | `Mono.when()` with multiple `putAsync()` |
| Enrich during map | 4 | `getAsync()` in `mapAsync()` |
| Conditional save | 5 | `@Value` flag + if check |
| Client-specific | 6 | Extend default, override methods |
| Legacy | 7 | `saveInSession()` / `map()` |

## Implementation Checklist

1. Extend `PayloadResponseMapper<FacadeResponse, PayloadResponse>`
2. Annotate `@Lazy` + `@Component("[Operation]PayloadResponseFromFacadeMapper[Client]")`
3. Override `mapAsync()` for transformation
4. Override `saveInSessionAsync()` if session persistence needed
5. Call `super.mapSource(s)` for base mapping
6. Call `super.saveInSessionAsync(source)` for base save
7. Use `.share()` in `saveInSessionAsync()` if source consumed multiple times
8. Use `.then()` to chain after session save
9. Use `Mono.when()` for multiple parallel saves
10. Handle nulls (conditional saves with `Mono.empty()`)

## Best Practices

- Use reactive methods (`mapAsync`, `saveInSessionAsync`)
- Call `super` for base processing
- Use `.thenReturn(s)` to preserve value after async operations
- Use `Mono.when()` for parallel saves
- Handle nulls with conditional saves
- Use `Mono.just(s)` for no-op branches
- Chain with `.flatMap()` when passing to super
- Keep transformation logic in `mapAsync()`
- Keep persistence logic in `saveInSessionAsync()`
- Don't store state in mapper fields
- Don't mix transformation and persistence
- Don't use `.block()` in reactive methods
- Don't use `.then(super.saveInSessionAsync(source))` with source parameter

## Examples

See `references/legacy/mapper-async-implementing/references/`:
- `01-simple-transformation.java` - Basic mapAsync
- `02-with-session-save.java` - Single saveInSessionAsync
- `03-multiple-session-saves.java` - Mono.when pattern (CheckInputPayloadResponseFromFacadeMapper)
- `04-session-enrichment.java` - GetAsync during mapping (GetCardInfoAllFromFacadeMapper)
- `05-conditional-save.java` - Config flag pattern
- `06-client-specific.java` - Client override
- `07-sync-legacy.java` - Synchronous pattern

## Source Skill: `mapper-sync-implementing`


# Mapper Sync Implementation

Use this for blocking mappers that translate facade responses into payload responses.

- Extend `PayloadResponseMapper<FacadeResponse, PayloadResponse>`.
- Keep transformation in `map(...)`.
- Keep persistence in `saveInSession(...)`.
- Call `super.map(source)` and `super.saveInSession(source)` when the base class should still run.
- See `references/legacy/mapper-sync-implementing/references/patterns.md` for repo examples and session-persistence cases.
