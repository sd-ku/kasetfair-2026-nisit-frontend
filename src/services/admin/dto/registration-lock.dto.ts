/**
 * Registration Lock DTOs
 * Based on backend API documentation
 */

/**
 * Registration Settings Response
 */
export interface RegistrationSettingsDto {
    id: number;
    isManuallyLocked: boolean;
    registrationStart: string | null;
    registrationEnd: string | null;
    lockMessage: string;
    isCurrentlyLocked: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Update Registration Settings Request
 * All fields are optional - only send what needs to be changed
 */
export interface UpdateRegistrationSettingsDto {
    isManuallyLocked?: boolean;
    registrationStart?: string | null;
    registrationEnd?: string | null;
    lockMessage?: string;
}

/**
 * Registration Lock Error Response
 */
export interface RegistrationLockErrorDto {
    statusCode: 403;
    message: string;
    error: "Forbidden";
    code: "REGISTRATION_LOCKED";
    registrationStart?: string | null;
    registrationEnd?: string | null;
}
