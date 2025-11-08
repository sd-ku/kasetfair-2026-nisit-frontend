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
    clubApplicationId?: string;
    leaderNisitId?: string;
    leaderFirstName?: string;
    leaderLastName?: string;
    leaderEmail?: string;
    leaderPhone?: string;
}