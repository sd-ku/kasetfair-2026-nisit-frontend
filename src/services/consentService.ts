import { http } from "@/lib/http"
import { AxiosError } from "axios";
import { ConsentTextResponseDto } from "./dto/consent.dto";

const CONSENT_SERVICE_API = `/api/consent-text`;

function isAxiosError(err: unknown): err is AxiosError {
  return !!(err as AxiosError)?.isAxiosError;
}

export function extractErrorMessage(
  error: unknown,
  fallback: string = "Unexpected error"
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function getConsentText(): Promise<ConsentTextResponseDto> {
    try {
        const res = await http.get(`${CONSENT_SERVICE_API}`);
        return res.data;
    } catch (error) {
        const message = extractErrorMessage(error, "Failed to load consent text");
        throw new Error(message);
    }
}