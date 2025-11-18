import { StoreType, StoreState } from "./store-info.dto"

export type MemberEmailsDraftDto = {
  email: string
  status: string
}

export type CreateStoreRequestDto = {
  storeName: string
  type: StoreType
  memberGmails: string[]
}

export type CreateStoreResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
  storeAdminNisitId: string
  missingProfileEmails?: string[]
  createdAt?: string
  updatedAt?: string
}

export type StoreDarftResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
  storeAdminNisitId: string
  memberEmails: MemberEmailsDraftDto[]
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
  storeAdminNisitId?: string
}
