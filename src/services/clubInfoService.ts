import { http } from "@/lib/http"
import {
  getStoreDraft,
  mapDraftErrors,
  normalizeClubInfo,
  type DraftFieldError,
  type StoreDraftClubInfo,
  type StoreDraftClubInfoDto,
  type StoreDraftData,
} from "./storeDraftService"
import { CreateClubInfoRequestDto, UpdateClubInfoRequestDto } from "./dto/club-info.dto"
import { extractErrorMessage } from "./storeServices"
import { ClubInfoResponseDto } from "./dto/club-info.dto"

const CLUB_INFO_ENDPOINT = "/api/store/mine/club-info"

export type UpdateClubInfoResponseBody = {
  ok?: boolean
  errors?: DraftFieldError[]
  clubInfo?: StoreDraftClubInfoDto | StoreDraftClubInfo | null
  data?: { clubInfo?: StoreDraftClubInfoDto | null } | null
  draft?: { clubInfo?: StoreDraftClubInfoDto | null } | null
}

export type UpdateClubInfoResult = {
  ok: boolean
  errors?: DraftFieldError[]
  clubInfo: StoreDraftClubInfo | null
}

export const getClubInfoDraft = getStoreDraft
export const mapClubInfoErrors = mapDraftErrors
export type { StoreDraftData }

export async function createClubInfo(payload: CreateClubInfoRequestDto): Promise<ClubInfoResponseDto> {
  try {
    const res = await http.post(CLUB_INFO_ENDPOINT, payload)

    return res.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to save organization information"))
  }
}

export async function updateClubInfo(payload: UpdateClubInfoRequestDto): Promise<UpdateClubInfoResult> {
  try {
    const res = await http.patch(CLUB_INFO_ENDPOINT, payload)
    const body: UpdateClubInfoResponseBody = res.data ?? {}
    const rawClubInfo =
      body.clubInfo ??
      body.data?.clubInfo ??
      body.draft?.clubInfo ??
      null

    return {
      ok: typeof body.ok === "boolean" ? body.ok : true,
      errors: Array.isArray(body.errors) ? body.errors : undefined,
      clubInfo: normalizeClubInfo(rawClubInfo),
    }
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to save organization information"))
  }
}

export async function getClubInfo(): Promise<ClubInfoResponseDto | null> {
  const res = await http.get(CLUB_INFO_ENDPOINT)

  return res.data ?? null

  // try {
  //   const res = await http.get(CLUB_INFO_ENDPOINT)

  //   return res.data ?? null
  // } catch (error: any) {
  //   const status = error?.response?.status ?? error?.status
  //   if (status === 404) {
  //     return null
  //   }
  //   throw new Error(extractErrorMessage(error, "Failed to load organization information"))
  // }
}
