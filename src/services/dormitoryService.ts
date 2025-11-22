import { http } from "@/lib/http"
import { AxiosError } from "axios"

export type Dormitory = {
  id: number
  label: string
  isActive: boolean
  order: number
}

export async function getDormitories(): Promise<Dormitory[]> {
  try {
    const res = await http.get(`/api/dormitories`)
    if (res.status === 200 || res.status === 201) {
      return res.data ?? []
    }
    throw new Error(`Unexpected status: ${res.status}`)
  } catch (error) {
    console.error("Failed to fetch dormitories:", error)
    if (isAxiosError(error)) {
      const data = error.response?.data as { error?: string; message?: string } | undefined
      throw new Error(data?.error || data?.message || "Failed to load dormitories")
    }
    throw new Error("Failed to load dormitories")
  }
}

function isAxiosError(err: unknown): err is AxiosError {
  return !!(err as AxiosError)?.isAxiosError
}

