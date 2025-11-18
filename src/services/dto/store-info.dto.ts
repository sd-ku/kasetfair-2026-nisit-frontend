export type StoreType = "Nisit" | "Club"

export type StoreState = "CreateStore" | "ClubInfo" | "StoreDetails" | "ProductDetails" | "Submitted" | "Pending"

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

export type UpdateStoreRequestDto = {
  storeName?: string;
  memberEmails?: string[];
  boothMediaId?: string | null;
}

export type StoreStatusRequestDto = {
  id: number
}

export type StoreStatusResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
  storeAdminNisitId: string
}

export type StoreValidationChecklistItemDto = {
  key?: string
  label?: string
  message?: string | null
  description?: string | null
  isValid?: boolean
  ok?: boolean
}

export type StorePendingValidationResponseDto = {
  storeId: number
  type: StoreType
  state: StoreState
  isValid: boolean
  checklist: StoreValidationChecklistItemDto[]
}

export type StoreMemberDto = {
  email: string;
  status: string;
}

export type StoreResponseDto = {
  id: number;
  storeName: string;
  boothNumber: string | null;
  type: StoreType;
  state: StoreState;
  storeAdminNisitId: string;
  members: StoreMemberDto[];
  boothLayoutMediaId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
