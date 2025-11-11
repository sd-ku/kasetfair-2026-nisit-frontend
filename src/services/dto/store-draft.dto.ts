import { StoreType, StoreState } from "./store-info.dto"

export type memberEmailsDraftDto = {
    email: string,
    status: string,
}

export type StoreDarftResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
  memberEmails: memberEmailsDraftDto[]
}

export type UpdateClubInfoRequestDto = {
    clubName?: string;
    clubApplicationMediaId?: string;
    leaderNisitId?: string;
    leaderFirstName?: string;
    leaderLastName?: string;
    leaderEmail?: string;
    leaderPhone?: string;
}

export type UpdateClubInfoResponseDto = {
  storeId: string,
  storeName: string,
  type: string,
  state: string,
  clubInfo: {
    clubName?: string;
    clubApplicationMediaId?: string;
    leaderNisitId?: string;
    leaderFirstName?: string;
    leaderLastName?: string;
    leaderEmail?: string;
    leaderPhone?: string;
  }
}

export type UpdateDraftStoreRequestDto = {
  storeId?: string,
  storeName?: string,
  boothMediaId?: string
}

export type UpdateDraftStoreResponsetDto = {
  storeId?: string,
  storeName?: string,
  boothMediaId?: string
}