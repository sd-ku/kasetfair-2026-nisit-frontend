import { http } from "@/lib/http"
import { AxiosError } from "axios"
import {
  CreateStoreRequestDto,
  CreateStoreResponseDto,
  StoreStatusRequestDto,
  StoreStatusResponseDto,
} from "./dto/store-info.dto"
import { StoreDarftResponseDto } from "./dto/store-draft.dto"

const STORE_SERVICE_API = "/api/store"

const STEP_LABELS = {
  createStore: "Create store",
  storeDetails: "Store information",
  productDetails: "Product information",
} as const

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
      console.log(msg)
      return msg
    }
    if (data?.error) return data.error
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export async function createStore(payload: CreateStoreRequestDto): Promise<CreateStoreResponseDto> {
  try {
    const res = await http.post(`${STORE_SERVICE_API}/create`, payload)

    if (res.status === 201 || res.status === 200) {
      return res.data
    }

    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error) {
    const message = extractErrorMessage(error, "Failed to create store")
    throw new Error(message)
  }
}

export async function getStoreDraft(step: string): Promise<StoreDarftResponseDto> {
  try {
    const res = await http.get(`${STORE_SERVICE_API}/mine/draft?step=${step}`)

    if (res.status === 201 || res.status === 200) {
      return res.data
    }

    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error) {
    const message = extractErrorMessage(error, "Failed to load store draft")
    throw new Error(message)
  }
}


export async function getStoreStatus(): Promise<StoreStatusResponseDto> {
  try {
    const res = await http.get(`${STORE_SERVICE_API}/mine`)

    if (res.status === 200) {
      return res.data
    }

    throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  } catch (error) {
    const message = extractErrorMessage(error, "Failed to load store status")
    throw new Error(message)
  }
}
