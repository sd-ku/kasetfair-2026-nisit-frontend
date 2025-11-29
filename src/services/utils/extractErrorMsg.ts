import { AxiosError } from "axios";

function isAxiosError(err: unknown): err is AxiosError {
    return !!(err as AxiosError)?.isAxiosError
}

export function extractErrorMessage(
    error: unknown,
    fallback: string = "Unexpected error"
): string {
    if (isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string[] } | undefined
        if (data?.message) {
            const msg = Array.isArray(data?.message)
                ? data.message.map((m: string) => `- ${m}`).join("\n")
                : data?.message || data?.error || error?.message || "เกิดข้อผิดพลาดขณะสร้างร้าน";
            return msg
        }
        if (data?.error) return data.error
    }

    if (error instanceof Error && error.message) {
        return error.message
    }

    return fallback
}