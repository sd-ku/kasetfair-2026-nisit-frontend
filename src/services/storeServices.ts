import { http } from "@/lib/http"
import { AxiosError } from "axios";
import { CreateStoreRequestDto, StoreStatusResponseDto } from "./dto/store-info.dto";

const STORE_SERVICE_API = "/api/store"

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

export async function createStore(payload: CreateStoreRequestDto) {
  try {
    const res = await http.post(`${STORE_SERVICE_API}/create`, payload)

    if (res.status === 201 || res.status === 200) return res.data
    
    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error: any) {
    console.error("createStore error:", error);
    const raw = error?.response?.data;
    const msg = Array.isArray(raw?.message)
      ? raw.message.join("\n")
      : raw?.message || raw?.error || error?.message || "เกิดข้อผิดพลาดขณะสร้างร้าน";
    throw new Error(msg);
  }
}

export async function getStoreStatus(payload: StoreStatusResponseDto) {
  try {
    const res = await http.post(`${STORE_SERVICE_API}/create`, payload)

    if (res.status === 201 || res.status === 200) return res.data
    
    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error) {
    console.error(error)
  }
}