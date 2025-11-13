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
import { UpdateClubInfoRequestDto } from "./dto/store-draft.dto"
import { extractErrorMessage } from "./storeServices"

const CLUB_INFO_ENDPOINT = "/api/store/mine/club-info"

export type ClubInfoSubmitPayload = UpdateClubInfoRequestDto

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

export async function updateClubInfo(payload: ClubInfoSubmitPayload): Promise<UpdateClubInfoResult> {
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
