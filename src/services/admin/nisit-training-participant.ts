import { http } from "@/lib/http";
import {
    FindAllParticipantsParams,
    FindAllParticipantsResponse,
    NisitTrainingParticipant,
    UpsertNisitTrainingParticipantDto,
} from "./dto/nisit-training-participant.dto";
import { extractErrorMessage } from "../utils/extractErrorMsg";

const NISIT_TRAINING_PARTICIPANT_API = `/api/admin/nisit-training-participant`;

/**
 * Get all participants with pagination and optional search by nisitId
 */
export async function findAllParticipants(
    params: FindAllParticipantsParams = {}
): Promise<FindAllParticipantsResponse> {
    try {
        const { page = 1, limit = 20, nisitId } = params;

        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("limit", limit.toString());
        if (nisitId) {
            queryParams.append("id", nisitId);
        }

        const res = await http.get(
            `${NISIT_TRAINING_PARTICIPANT_API}?${queryParams.toString()}`
        );

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to fetch participants");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to fetch participants"
        );
        throw new Error(message);
    }
}

/**
 * Upsert participant (Create or Update)
 */
export async function upsertParticipant(
    dto: UpsertNisitTrainingParticipantDto
): Promise<NisitTrainingParticipant> {
    try {
        const res = await http.post(`${NISIT_TRAINING_PARTICIPANT_API}`, dto);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to upsert participant");
    } catch (error) {
        const message = extractErrorMessage(error, "Failed to upsert participant");
        throw new Error(message);
    }
}

/**
 * Remove participant by ID
 */
export async function removeParticipant(id: string): Promise<void> {
    try {
        const res = await http.delete(`${NISIT_TRAINING_PARTICIPANT_API}/${id}`);

        if (res.status === 200 || res.status === 204) {
            return;
        }

        throw new Error("Failed to remove participant");
    } catch (error) {
        const message = extractErrorMessage(error, "Failed to remove participant");
        throw new Error(message);
    }
}
