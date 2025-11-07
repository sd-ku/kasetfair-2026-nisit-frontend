export type NisitInfo = {
  firstName: string
  lastName: string
  nisitId: string
  phone: string
  nisitCardMediaId: string | null
}

export type RegisterResponse = {
  id: string
  profileComplete: boolean
}

export type UpdateNisitInfoPayload = {
  firstName?: string
  lastName?: string
  phone?: string
}