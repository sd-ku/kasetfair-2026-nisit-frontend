import { StoreType, StoreState } from "@/services/dto/store-info.dto"
import type { UpdateClubInfoRequestDto } from "@/services/dto/store-draft.dto"

// step config + helper

export const STEP_LABELS = {
  createStore: "Create store",
  clubInfo: "Organization information",
  storeDetails: "Store information",
  productDetails: "Product information",
} as const

export const STEP_CONFIG_BY_TYPE: Record<StoreType, Array<{ id: number; label: string }>> = {
  Nisit: [
    { id: 1, label: STEP_LABELS.createStore },
    { id: 2, label: STEP_LABELS.storeDetails },
    { id: 3, label: STEP_LABELS.productDetails },
  ],
  Club: [
    { id: 1, label: STEP_LABELS.createStore },
    { id: 2, label: STEP_LABELS.clubInfo },
    { id: 3, label: STEP_LABELS.storeDetails },
    { id: 4, label: STEP_LABELS.productDetails },
  ],
}

export const getLayoutStepIndex = (type: StoreType) => (type === "Club" ? 3 : 2)
export const getProductStepIndex = (type: StoreType) => (type === "Club" ? 4 : 3)
export const getStepsForType = (type: StoreType) => STEP_CONFIG_BY_TYPE[type]

export const clampStepToState = (
  step: number,
  type: StoreType | null,
  state: StoreState | null
): number => {
  if (!type) return Math.max(1, step)

  let maxStep = 1
  switch (state) {
    case "CreateStore":
      maxStep = 1
      break
    case "ClubInfo":
      maxStep = 2
      break
    case "StoreDetails":
      maxStep = getLayoutStepIndex(type)
      break
    case "ProductDetails":
      maxStep = getProductStepIndex(type)
      break
    case "Submitted":
      maxStep = getStepsForType(type).length
      break
    default:
      maxStep = 1
  }

  return Math.max(1, Math.min(step, maxStep))
}

export const preferredStepForState = (type: StoreType, state: StoreState): number => {
  switch (state) {
    case "CreateStore":
      return 1
    case "ClubInfo":
      return 2
    case "StoreDetails":
      return type === "Club" ? 2 : getLayoutStepIndex(type)
    case "ProductDetails":
    case "Submitted":
      return getProductStepIndex(type)
    default:
      return 1
  }
}

// map step → draft key
export const stepToDraftKey = (type: StoreType, step: number): string | null => {
  if (step === 1) return "create-store"
  if (type === "Club" && step === 2) return "club-info"
  if (step === getLayoutStepIndex(type)) return "store-details"
  if (step === getProductStepIndex(type)) return "product-details"
  return null
}

export type ClubInfoFieldKey =
  | "organizationName"
  | "presidentFirstName"
  | "presidentLastName"
  | "presidentNisitId"
  | "presidentEmail"
  | "presidentPhone"
  | "applicationFileName"

export const CLUB_INFO_REQUIRED_FIELDS: Exclude<ClubInfoFieldKey, "applicationFileName">[] = [
  "organizationName",
  "presidentFirstName",
  "presidentLastName",
  "presidentNisitId",
  "presidentEmail",
  "presidentPhone",
]

type ClubInfoPayloadMap = Record<ClubInfoFieldKey, keyof UpdateClubInfoRequestDto>

export const CLUB_INFO_REQUEST_FIELD_MAP: ClubInfoPayloadMap = {
  organizationName: "clubName",
  presidentFirstName: "leaderFirstName",
  presidentLastName: "leaderLastName",
  presidentNisitId: "leaderNisitId",
  presidentEmail: "leaderEmail",
  presidentPhone: "leaderPhone",
  applicationFileName: "clubApplicationId",
}
