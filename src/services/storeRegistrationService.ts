import { http } from "@/lib/http";
import { extractErrorMessage } from "./utils/extractErrorMsg";
import type {
    RegistrationSettingsDto,
    RegistrationStatusResponseDto
} from "./admin/dto/registration-lock.dto";

/**
 * Get current registration status (public endpoint)
 * This endpoint is accessible by anyone without admin permissions
 * @returns Promise with registration settings data
 */
export async function getStoreRegistrationSettings(): Promise<RegistrationSettingsDto> {
    try {
        const res = await http.get<RegistrationStatusResponseDto>(`/api/registration/status`);

        if (res.status === 200 || res.status === 201) {
            // Map the status response to settings format
            return {
                id: 0, // Not provided by status endpoint
                isManuallyLocked: res.data.isLocked,
                isCurrentlyLocked: res.data.isLocked,
                lockMessage: res.data.message || "",
                registrationStart: res.data.registrationStart || null,
                registrationEnd: res.data.registrationEnd || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }

        throw new Error("Failed to fetch registration status");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to fetch registration status"
        );
        throw new Error(message);
    }
}
