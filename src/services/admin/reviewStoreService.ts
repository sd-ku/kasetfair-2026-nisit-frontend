import { http } from "@/lib/http";
import {
    FindAllStoresParams,
    FindAllStoresResponse,
    UpdateStoreStatusDto,
    UpdateStoreStatusResponse,
    ValidateAllStoresResponse,
    ValidateSingleStoreResponse,
} from "./dto/review-store.dto";
import { extractErrorMessage } from "../utils/extractErrorMsg";
import { StatsResponseDto } from "./dto/stats-store.dto";

const ADMIN_STORE_API = `/api/admin/store`;

/**
 * Get all stores with optional filters and pagination
 * @param params - Query parameters for filtering and pagination
 * @returns Promise with stores data and pagination metadata
 */
export async function findAllStores(
    params: FindAllStoresParams = {}
): Promise<FindAllStoresResponse> {
    try {
        const { status, type, search, sort, page = 1, limit = 10 } = params;

        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("limit", limit.toString());

        if (status) {
            queryParams.append("status", status);
        }
        if (type) {
            queryParams.append("type", type);
        }
        if (search) {
            queryParams.append("search", search);
        }
        if (sort) {
            queryParams.append("sort", sort);
        }

        const res = await http.get(
            `${ADMIN_STORE_API}?${queryParams.toString()}`
        );

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to fetch stores");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to fetch stores"
        );
        throw new Error(message);
    }
}

/**
 * Update store status/state
 * @param id - Store ID
 * @param targetState - New state to update to
 * @returns Promise with updated store data
 */
export async function updateStoreStatus(
    id: number,
    targetState: UpdateStoreStatusDto["targetState"]
): Promise<UpdateStoreStatusResponse> {
    try {
        const body: UpdateStoreStatusDto = { targetState };

        const res = await http.patch(
            `${ADMIN_STORE_API}/${id}/state`,
            body
        );

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to update store status");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to update store status"
        );
        throw new Error(message);
    }
}

/**
 * Get a single store by ID
 * @param id - Store ID
 * @returns Promise with store data
 */
export async function getStoreById(
    id: number
): Promise<UpdateStoreStatusResponse> {
    try {
        const res = await http.get(`${ADMIN_STORE_API}/${id}`);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to fetch store");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to fetch store"
        );
        throw new Error(message);
    }
}

export async function getStats(): Promise<StatsResponseDto> {
    try {
        const res = await http.get(`${ADMIN_STORE_API}/stats`);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to fetch stats");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to fetch stats"
        );
        throw new Error(message);
    }
}

/**
 * Validate all stores and create review drafts
 * @returns Promise with validation results
 */
export async function validateAllStores(): Promise<ValidateAllStoresResponse> {
    try {
        const res = await http.post(`${ADMIN_STORE_API}/validate-all`);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to validate stores");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to validate stores"
        );
        throw new Error(message);
    }
}

/**
 * Validate a single store and create review draft
 * @param id - Store ID
 * @returns Promise with validation result
 */
export async function validateSingleStore(
    id: number
): Promise<ValidateSingleStoreResponse> {
    try {
        const res = await http.post(`${ADMIN_STORE_API}/${id}/validate`);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to validate store");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to validate store"
        );
        throw new Error(message);
    }
}

/**
 * Merge review status from drafts to all stores
 * @returns Promise with merge results
 */
export async function mergeAllReviewStatus(): Promise<any> {
    try {
        const res = await http.post(`${ADMIN_STORE_API}/merge-review-status`);

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to merge review status");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to merge review status"
        );
        throw new Error(message);
    }
}

/**
 * Merge review status from draft to a single store
 * @param id - Store ID
 * @returns Promise with merge result
 */
export async function mergeSingleReviewStatus(id: number): Promise<any> {
    try {
        const res = await http.post(
            `${ADMIN_STORE_API}/${id}/merge-review-status`
        );

        if (res.status === 200 || res.status === 201) {
            return res.data;
        }

        throw new Error("Failed to merge review status");
    } catch (error) {
        const message = extractErrorMessage(
            error,
            "Failed to merge review status"
        );
        throw new Error(message);
    }
}
