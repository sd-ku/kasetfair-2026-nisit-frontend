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

/**
 * Bulk upsert participants from array of Nisit IDs
 */
export async function upsertBulk(
    nisitIds: string[]
): Promise<NisitTrainingParticipant[]> {
    try {
        const res = await http.post(
            `${NISIT_TRAINING_PARTICIPANT_API}/upsert-bulk`,
            nisitIds
        );

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to bulk upsert participants");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to bulk upsert participants"
        );
        throw new Error(message);
    }
}

/**
 * Delete all participants from the table
 */
export async function deleteAll(): Promise<void> {
    try {
        const res = await http.delete(
            `${NISIT_TRAINING_PARTICIPANT_API}/delete-all`
        );

        if (res.status === 200 || res.status === 204) {
            return;
        }

        throw new Error("Failed to delete all participants");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to delete all participants"
        );
        throw new Error(message);
    }
}

/**
 * Parse bulk nisit IDs from text input
 * Removes whitespace, letters, and splits by newlines/commas/spaces
 * Returns array of clean nisit ID strings
 */
export function parseBulkNisitIds(text: string): string[] {
    if (!text || !text.trim()) {
        return [];
    }

    // Split by newlines, commas, or multiple spaces
    const lines = text.split(/[\n,\s]+/);

    // Filter and clean each line
    const nisitIds = lines
        .map(line => line.trim())
        // Remove any non-numeric characters
        .map(line => line.replace(/\D/g, ''))
        // Filter out empty strings
        .filter(id => id.length > 0)
        // Remove duplicates
        .filter((id, index, self) => self.indexOf(id) === index);

    return nisitIds;
}
