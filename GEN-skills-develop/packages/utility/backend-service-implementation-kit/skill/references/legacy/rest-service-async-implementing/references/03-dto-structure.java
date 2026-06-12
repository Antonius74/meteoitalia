/**
 * Example 5: DTO Package Structure
 * Shows proper organization of request, response, and domain objects
 */

// ============================================================
// FILE: dto/request/CreateUserRequest.java
// ============================================================
package it.icbpi.digitalreview.rest.iam.dto.request;

import it.icbpi.digitalreview.archcomps.restclient.soa.dto.BaseMicroSoaRestServiceRequest;
import it.icbpi.digitalreview.rest.iam.dto.domain.UserInfo;
import it.icbpi.digitalreview.rest.iam.dto.domain.Address;
import it.icbpi.digitalreview.rest.iam.dto.domain.ContactPreferences;

/**
 * Request DTO for creating a user
 * References domain objects from dto/domain/
 */
public class CreateUserRequest extends BaseMicroSoaRestServiceRequest {

    private UserInfo userInfo;              // From domain/
    private Address residenceAddress;       // From domain/
    private Address domicileAddress;        // From domain/
    private ContactPreferences preferences; // From domain/
    private String referralCode;

    // Getters and setters
}

// ============================================================
// FILE: dto/response/CreateUserResponse.java
// ============================================================
package it.icbpi.digitalreview.rest.iam.dto.response;

import it.icbpi.digitalreview.rest.iam.dto.domain.UserInfo;
import it.icbpi.digitalreview.rest.iam.dto.domain.UserStatus;
import it.icbpi.digitalreview.archcomps.restclient.soa.dto.BaseMicroSoaRestServiceResponse;
import java.time.LocalDateTime;

/**
 * Response DTO for user creation
 * Reuses UserInfo from domain/ (same object used in request)
 */
public class CreateUserResponse extends BaseMicroSoaRestServiceResponse{
    private String userId;
    private UserInfo userInfo;          // From domain/ (shared with request)
    private UserStatus status;          // Enum from domain/
    private LocalDateTime createdDate;
    private boolean success;

    // Getters and setters
}

// ============================================================
// FILE: dto/domain/UserInfo.java
// ============================================================
package it.icbpi.digitalreview.rest.iam.dto.domain;

/**
 * Domain object shared between requests and responses
 * Contains core user information
 */
public class UserInfo implements Serializable{
    private static final long serialVersionUID = 1L;

    private String fiscalCode;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String birthDate;
    private String birthPlace;

    // Getters and setters
}

// ============================================================
// FILE: dto/domain/Address.java
// ============================================================
package it.icbpi.digitalreview.rest.iam.dto.domain;

/**
 * Domain object for address data
 * Used in multiple requests (residence, domicile, billing, etc.)
 */
public class Address implements Serializable{
    private static final long serialVersionUID = 1L;

    private String street;
    private String city;
    private String province;
    private String postalCode;
    private String country;

    // Getters and setters
}

// ============================================================
// FILE: dto/domain/ContactPreferences.java
// ============================================================
package it.icbpi.digitalreview.rest.iam.dto.domain;

/**
 * Domain object for user preferences
 * Nested in request DTOs
 */
public class ContactPreferences {

    private boolean emailNotifications;
    private boolean smsNotifications;
    private boolean pushNotifications;
    private String preferredLanguage;

    // Getters and setters
}

// ============================================================
// FILE: dto/domain/UserStatus.java
// ============================================================
package it.icbpi.digitalreview.rest.iam.dto.domain;

/**
 * Enum for user status
 * Shared across multiple responses
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    PENDING_VERIFICATION,
    LOCKED
}
