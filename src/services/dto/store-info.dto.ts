export type StoreType = "Nisit" | "Club"

export type StoreState = "CreateStore" | "ClubInfo" | "StoreDetails" | "ProductDetails" | "Submitted" | "Pending"

export type GoodsType = "Food" | "NonFood"

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
  storeAdminNisitId?: string | null;
  goodType?: GoodsType;
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
  goodType: GoodsType | null;
  createdAt: Date;
  updatedAt: Date;
}

export type StoreValidateResponseDto = {
  store: {
    id: number;
    storeName: string;
    type: StoreType;
    state: StoreState;
    boothNumber: string;
    storeAdminNisitId: string | null;
  };

  isValid: boolean;

  sections: {
    key: 'members' | 'clubInfo' | 'storeDetail' | 'goods';
    label: string;
    ok: boolean;
    items: {
      key: string;
      label: string;
      ok: boolean;
      message?: string;
    }[];
  }[];
};
