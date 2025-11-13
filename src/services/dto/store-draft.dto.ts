import { StoreType, StoreState } from "./store-info.dto"

export type MemberEmailsDraftDto = {
  email: string
  status: string
}

export type StoreDarftResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
  memberEmails: MemberEmailsDraftDto[]
}

export type UpdateClubInfoRequestDto = {
  clubName?: string
  clubApplicationMediaId?: string | null
  leaderNisitId?: string
  leaderFirstName?: string
  leaderLastName?: string
  leaderEmail?: string
  leaderPhone?: string
  applicationFileName?: string | null
}

export type UpdateClubInfoResponseDto = {
  storeId: string
  storeName: string
  type: StoreType
  state: StoreState
  clubInfo: UpdateClubInfoRequestDto
}

export type UpdateDraftStoreRequestDto = {
  storeName?: string
  type?: StoreType
  memberEmails?: string[]
  boothMediaId?: string | null
}

export type UpdateDraftStoreResponseDto = {
  storeName: string
  type: StoreType
  memberEmails: string[]
  missingProfileEmails: string[]
  boothMediaId: string | null
}
