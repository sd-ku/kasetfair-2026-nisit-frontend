import { http } from "@/lib/http";
import { MediaInfoDto } from "@/services/dto/media.dto";
import { extractErrorMessage } from "../utils/extractErrorMsg";

const ADMIN_MEDIA_API = `/api/admin/media`;

/**
 * Get media information by media ID (Admin API)
 * @param mediaId - Media ID
 * @returns Promise with media information
 */
export async function getMediaInfo(mediaId: string): Promise<MediaInfoDto> {
    try {
        const res = await http.get(`${ADMIN_MEDIA_API}/s3/${mediaId}`);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to fetch media info");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to fetch media info"
        );
        throw new Error(message);
    }
}
