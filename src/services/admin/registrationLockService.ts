import { http } from "@/lib/http";
import { extractErrorMessage } from "../utils/extractErrorMsg";
import {
    RegistrationSettingsDto,
    UpdateRegistrationSettingsDto,
} from "./dto/registration-lock.dto";

const REGISTRATION_API = `/api/admin/registration`;

/**
 * Get current registration settings
 * @returns Promise with registration settings data
 */
export async function getRegistrationSettings(): Promise<RegistrationSettingsDto> {
    try {
        const res = await http.get(`${REGISTRATION_API}/settings`);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to fetch registration settings");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to fetch registration settings"
        );
        throw new Error(message);
    }
}

/**
 * Update registration settings
 * @param settings - Settings to update (all fields optional)
 * @returns Promise with updated registration settings
 */
export async function updateRegistrationSettings(
    settings: UpdateRegistrationSettingsDto
): Promise<RegistrationSettingsDto> {
    try {
        const res = await http.patch(
            `${REGISTRATION_API}/settings`,
            settings
        );

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to update registration settings");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to update registration settings"
        );
        throw new Error(message);
    }
}

/**
 * Lock registration immediately (manual lock)
 * @param lockMessage - Optional custom message to display
 * @returns Promise with updated registration settings
 */
export async function lockRegistration(
    lockMessage?: string
): Promise<RegistrationSettingsDto> {
    const settings: UpdateRegistrationSettingsDto = {
        isManuallyLocked: true,
    };

    if (lockMessage) {
        settings.lockMessage = lockMessage;
    }

    return updateRegistrationSettings(settings);
}

/**
 * Unlock registration (remove manual lock)
 * @returns Promise with updated registration settings
 */
export async function unlockRegistration(): Promise<RegistrationSettingsDto> {
    return updateRegistrationSettings({
        isManuallyLocked: false,
    });
}

/**
 * Set time-based registration period
 * @param start - Registration start time (ISO string)
 * @param end - Registration end time (ISO string)
 * @param lockMessage - Optional custom message to display when locked
 * @returns Promise with updated registration settings
 */
export async function setRegistrationPeriod(
    start: string | null,
    end: string | null,
    lockMessage?: string
): Promise<RegistrationSettingsDto> {
    const settings: UpdateRegistrationSettingsDto = {
        registrationStart: start,
        registrationEnd: end,
    };

    if (lockMessage) {
        settings.lockMessage = lockMessage;
    }

    return updateRegistrationSettings(settings);
}

/**
 * Clear time-based registration period
 * @returns Promise with updated registration settings
 */
export async function clearRegistrationPeriod(): Promise<RegistrationSettingsDto> {
    return updateRegistrationSettings({
        registrationStart: null,
        registrationEnd: null,
    });
}
