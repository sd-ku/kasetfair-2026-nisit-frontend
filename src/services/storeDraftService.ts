import { http } from "@/lib/http"
import { GoodsType } from "./dto/goods.dto"
import { StoreType } from "./dto/store-info.dto"
import { UpdateDraftStoreRequestDto, UpdateDraftStoreResponseDto } from "./dto/store-draft.dto"
import { extractErrorMessage } from "./storeServices"

const STORE_DRAFT_ENDPOINT = "/api/store/mine/draft"

export type DraftFieldError = {
  field: string
  message: string
}

export type DraftErrorMap = Record<string, string>

export type StoreDraftProductDto = {
  id?: string | number | null
  name?: string | null
  price?: number | string | null
  type?: GoodsType | null
  mediaId?: string | null
  mediaFileName?: string | null
  imageName?: string | null
  fileName?: string | null
}

export type StoreDraftClubInfoDto = {
  clubName?: string | null
  leaderFirstName?: string | null
  leaderLastName?: string | null
  leaderNisitId?: string | null
  leaderEmail?: string | null
  leaderPhone?: string | null
  clubApplicationMediaId?: string | null
  applicationFileName?: string | null
}

export type StoreDraftDto = {
  id?: number | null
  type?: StoreType | null
  storeName?: string | null
  description?: string | null
  boothMediaId?: string | null
  boothLayoutFileName?: string | null
  layoutFileName?: string | null
  products?: StoreDraftProductDto[]
  goods?: StoreDraftProductDto[]
  clubInfo?: StoreDraftClubInfoDto | null
  updatedAt?: string | null
}

export type StoreDraftProduct = {
  id: string | null
  name: string
  price: number | null
  type: GoodsType
  mediaId: string | null
  mediaFileName: string | null
}

export type StoreDraftClubInfo = {
  clubName: string
  leaderFirstName: string
  leaderLastName: string
  leaderNisitId: string
  leaderEmail: string
  leaderPhone: string
  clubApplicationMediaId: string | null
  applicationFileName: string | null
}

export type StoreDraftData = {
  id: number | null
  type: StoreType | null
  storeName: string
  description: string
  boothMediaId: string | null
  boothLayoutFileName: string | null
  products: StoreDraftProduct[]
  clubInfo: StoreDraftClubInfo | null
  updatedAt?: string | null
}

const isStoreType = (value: unknown): value is StoreType =>
  value === "Nisit" || value === "Club"

const normalizeString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback

const normalizeNullableString = (value: unknown, fallback: string | null = null): string | null => {
  if (value === null) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  return fallback
}

const normalizeStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) return fallback
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0)
}

const normalizeProduct = (product: StoreDraftProductDto): StoreDraftProduct => ({
  id: typeof product.id === "number" || typeof product.id === "string" ? String(product.id) : null,
  name: normalizeString(product.name),
  price: typeof product.price === "number"
    ? product.price
    : typeof product.price === "string" && product.price.trim()
      ? Number(product.price)
      : null,
  type: product.type === "NonFood" ? "NonFood" : "Food",
  mediaId: product.mediaId ?? null,
  mediaFileName:
    product.mediaFileName ??
    product.fileName ??
    product.imageName ??
    null,
})

export const normalizeClubInfo = (clubInfo?: StoreDraftClubInfoDto | null): StoreDraftClubInfo | null => {
  if (!clubInfo) return null
  return {
    clubName: normalizeString(clubInfo.clubName),
    leaderFirstName: normalizeString(clubInfo.leaderFirstName),
    leaderLastName: normalizeString(clubInfo.leaderLastName),
    leaderNisitId: normalizeString(clubInfo.leaderNisitId),
    leaderEmail: normalizeString(clubInfo.leaderEmail),
    leaderPhone: normalizeString(clubInfo.leaderPhone),
    clubApplicationMediaId: clubInfo.clubApplicationMediaId ?? null,
    applicationFileName: clubInfo.applicationFileName ?? null,
  }
}

const normalizeDraft = (draft?: StoreDraftDto | null): StoreDraftData | null => {
  if (!draft) return null

  const productsSource = Array.isArray(draft.goods) ? draft.goods : draft.products ?? []
  const normalizedProducts = productsSource.map(normalizeProduct)

  return {
    id: typeof draft.id === "number" ? draft.id : null,
    type: isStoreType(draft.type) ? draft.type : null,
    storeName: normalizeString(draft.storeName),
    description: normalizeString(draft.description),
    boothMediaId: draft.boothMediaId ?? null,
    boothLayoutFileName: draft.boothLayoutFileName ?? draft.layoutFileName ?? null,
    products: normalizedProducts,
    clubInfo: normalizeClubInfo(draft.clubInfo),
    updatedAt: draft.updatedAt ?? null,
  }
}

export async function getStoreDraft(): Promise<StoreDraftData | null> {
  try {
    const res = await http.get(STORE_DRAFT_ENDPOINT)
    const data = normalizeDraft(res.data?.draft ?? res.data)
    return data
  } catch (error: any) {
    const status = error?.response?.status ?? error?.status
    if (status === 404) {
      return null
    }
    throw new Error(extractErrorMessage(error, "Failed to load store draft"))
  }
}

const normalizeDraftUpdateResponse = (
  body: unknown,
  fallback: UpdateDraftStoreRequestDto
): UpdateDraftStoreResponseDto => {
  const response = (body ?? {}) as Partial<UpdateDraftStoreResponseDto> & {
    type?: unknown
    memberEmails?: unknown
    missingProfileEmails?: unknown
    boothMediaId?: unknown
  }

  const resolvedStoreName = normalizeString(response.storeName, fallback.storeName ?? "")

  const resolvedType = isStoreType(response.type)
    ? response.type
    : isStoreType(fallback.type)
      ? fallback.type
      : (() => {
          throw new Error("Store draft response is missing a valid store type.")
        })()

  const memberEmails = normalizeStringArray(response.memberEmails, fallback.memberEmails ?? [])
  const missingProfileEmails = normalizeStringArray(response.missingProfileEmails, [])
  const boothMediaId = normalizeNullableString(response.boothMediaId, fallback.boothMediaId ?? null)

  return {
    storeName: resolvedStoreName,
    type: resolvedType,
    memberEmails,
    missingProfileEmails,
    boothMediaId,
  }
}

export async function patchStoreDraft(
  payload: UpdateDraftStoreRequestDto
): Promise<UpdateDraftStoreResponseDto> {
  try {
    const res = await http.patch(STORE_DRAFT_ENDPOINT, payload)
    const body = res.data ?? {}
    return normalizeDraftUpdateResponse(body, payload)
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to update store draft"))
  }
}

export const mapDraftErrors = (errors?: DraftFieldError[]): DraftErrorMap =>
  Array.isArray(errors)
    ? errors.reduce<DraftErrorMap>((acc, err) => {
        if (err?.field) acc[err.field] = err.message ?? "Invalid value"
        return acc
      }, {})
    : {}
