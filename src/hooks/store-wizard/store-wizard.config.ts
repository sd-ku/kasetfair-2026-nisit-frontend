import { StoreType, StoreState } from "@/services/dto/store-info.dto"

// step config + helper

export const STEP_LABELS = {
  createStore: "Create store",
  storeDetails: "Store information",
  productDetails: "Product information",
  commitStatus: "Submission status",
} as const

export const STEP_CONFIG_BY_TYPE: Record<StoreType, Array<{ id: number; label: string }>> = {
  Nisit: [
    { id: 1, label: STEP_LABELS.createStore },
    { id: 2, label: STEP_LABELS.storeDetails },
    { id: 3, label: STEP_LABELS.productDetails },
    { id: 4, label: STEP_LABELS.commitStatus },
  ],
  Club: [
    { id: 1, label: STEP_LABELS.createStore },
    { id: 2, label: STEP_LABELS.storeDetails },
    { id: 3, label: STEP_LABELS.productDetails },
    { id: 4, label: STEP_LABELS.commitStatus },
  ],
}

export const getLayoutStepIndex = (_type: StoreType) => 2
export const getProductStepIndex = (_type: StoreType) => 3
export const getCommitStepIndex = (_type: StoreType) => 4
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
    case "StoreDetails":
      maxStep = getLayoutStepIndex(type)
      break
    case "ProductDetails":
      maxStep = getProductStepIndex(type)
      break
    case "Pending":                     // ⬅️ เหลือแค่นี้
      maxStep = 4// getCommitStepIndex(type)
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
    case "StoreDetails":
      return getLayoutStepIndex(type)
    case "ProductDetails":
      return getProductStepIndex(type)
    case "Pending":                    // ⬅️ Submitted ถูกลบออก
      return 4// getCommitStepIndex(type)
    default:
      return 1
  }
}

// map step to draft key
export const stepToDraftKey = (type: StoreType, step: number): string | null => {
  if (step === 1) return "create-store"
  if (step === getLayoutStepIndex(type)) return "store-details"
  if (step === getProductStepIndex(type)) return "product-details"
  return null
}
