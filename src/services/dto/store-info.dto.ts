export type StoreType = "Nisit" | "Club"

export type StoreState = "CreateStore" | "StoreDetails" | "ProductDetails" | "Submitted"

export type ClubApplicationDto = {
  organizationName: string
  presidentFirstName: string
  presidentLastName: string
  presidentStudentId: string
  applicationFileName?: string | null
}

export type CreateStoreRequestDto = {
  storeName: string
  type: StoreType
  memberGmails: string[]
  clubApplication?: ClubApplicationDto
}

export type CreateStoreResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
  missingProfileEmails?: string[]
  createdAt?: string
  updatedAt?: string
}

export type StoreStatusRequestDto = {
  id: number
}

export type StoreStatusResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
}
