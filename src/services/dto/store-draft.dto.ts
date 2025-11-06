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