import { http } from "@/lib/http"
import { AxiosError } from "axios"
import { StoreDarftResponseDto, UpdateDraftStoreRequestDto } from "./dto/store-draft.dto"
import { CreateGoodRequestDto, GoodsResponseDto, UpdateGoodRequestDto } from "./dto/goods.dto"
import { StoreResponseDto, UpdateStoreRequestDto } from "./dto/store-info.dto"

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

export async function leaveMyStore() {
  const res = await http.delete(`${STORE_SERVICE_API}/mine/member/me`)
  return res.data
}

export async function getStoreStatus(): Promise<StoreResponseDto> {
  const res = await http.get(`${STORE_SERVICE_API}/mine`)
  return res.data
  // try {
  //   const res = await http.get(`${STORE_SERVICE_API}/mine`)
  //   return res
  //   if (res.status === 200) {
  //     return res.data
  //   }

  //   throw new Error(res.data?.error || `Unexpected status: ${res.status}`)
  // } catch (error) {
  //   const message = extractErrorMessage(error, "Failed to load store status")
  //   throw new Error(message)
  // }
}

export async function updateStore(payload: UpdateStoreRequestDto): Promise<StoreResponseDto> {
  const res = await http.patch(`${STORE_SERVICE_API}/mine`, payload)
  return res.data
}

// ---------- Goods ----------

export async function listGoods(): Promise<GoodsResponseDto[]> {
  try {
    const res = await http.get(`${STORE_SERVICE_API}/goods`)
    return res.data
  } catch (error) {
    const message = extractErrorMessage(error, "Failed to load goods")
    throw new Error(message)
  }
}

export async function createGood(payload: CreateGoodRequestDto): Promise<GoodsResponseDto> {
  try {
    const res = await http.post(`${STORE_SERVICE_API}/goods`, payload)
    return res.data
  } catch (error) {
    const message = extractErrorMessage(error, "Failed to create good")
    throw new Error(message)
  }
}

export async function updateGood(
  goodId: string,
  payload: UpdateGoodRequestDto
): Promise<GoodsResponseDto> {
  try {
    const res = await http.patch(`${STORE_SERVICE_API}/goods/${goodId}`, payload)
    return res.data
  } catch (error) {
    const message = extractErrorMessage(error, "Failed to update good")
    throw new Error(message)
  }
}

export async function deleteGood(goodId: string): Promise<void> {
  try {
    await http.delete(`${STORE_SERVICE_API}/goods/${goodId}`)
  } catch (error) {
    const message = extractErrorMessage(error, "Failed to delete good")
    throw new Error(message)
  }
}
