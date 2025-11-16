"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CreateStoreResponseDto,
  StoreState,
  StoreStatusResponseDto,
  StoreType,
} from "@/services/dto/store-info.dto"
import { StoreDarftResponseDto } from "@/services/dto/store-draft.dto"
import { extractErrorMessage, getStoreStatus } from "@/services/storeServices"
import {
  clampStepToState,
  getLayoutStepIndex,
  getProductStepIndex,
  getStepsForType,
  preferredStepForState,
} from "./store-wizard.config"

export type StoreProgress = (CreateStoreResponseDto | StoreStatusResponseDto | StoreDarftResponseDto) &
  Partial<{
    memberEmails: Array<{ email: string; status: string }>
    clubInfo: {
      clubName?: string
      leaderFirstName?: string
      leaderLastName?: string
      leaderNisitId?: string
      leaderEmail?: string
      leaderPhone?: string
      applicationFileName?: string | null
      clubApplicationMediaId?: string | null
      applicationFileId?: string | null
    }
    layoutDescription?: string | null
    layoutFileName?: string | null
    boothMediaId?: string | null
    products: Array<{
      id?: string | number
      name?: string
      price?: string | number
      fileName?: string | null
      imageName?: string | null
    }>
  }>

export type WizardStepIndicator = {
  id: number
  label: string
  status: "completed" | "current" | "upcoming"
}

export const STORE_ID_STORAGE_KEY = "kasetfair-active-store-id"

export type SnapshotSyncOptions = {
  syncStep?: boolean
  step?: number
  clampStep?: boolean
  preventRegression?: boolean
}

export type StoreWizardCore = {
  storeType: StoreType | null
  storeStatus: StoreProgress | null
  loadingStatus: boolean
  stepError: string | null
  setStepError: (value: string | null) => void
  currentStep: number
  stateStep: number | null
  layoutStepIndex: number
  productStepIndex: number
  steps: WizardStepIndicator[]
  goToStep: (step: number, options?: { clamp?: boolean }) => void
  goNextStep: (options?: { clamp?: boolean }) => void
  reloadStatus: (options?: SnapshotSyncOptions) => Promise<StoreProgress | null>
  applyStoreSnapshot: (
    snapshot: StoreProgress,
    options?: SnapshotSyncOptions
  ) => void
  selectStoreType: (type: StoreType) => void
  resetWizard: (options?: { preserveType?: boolean }) => void
  resetSignal: number
}

const STORE_STATE_ORDER: StoreState[] = [
  "CreateStore",
  "StoreDetails",
  "ProductDetails",
  "Submitted",
  "Pending",
]

const getStateRank = (state?: StoreState | null): number => {
  if (!state) return 0
  const index = STORE_STATE_ORDER.indexOf(state)
  return index >= 0 ? index : 0
}

export function useStoreWizardCore(): StoreWizardCore {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [storeType, setStoreType] = useState<StoreType | null>(null)
  const [storeStatus, setStoreStatus] = useState<StoreProgress | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [stepError, setStepError] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)

  const typeFromQuery = useMemo<StoreType | null>(() => {
    const raw = searchParams.get("type")
    if (!raw) return null
    const normalized = raw.toLowerCase()
    if (normalized === "nisit") return "Nisit"
    if (normalized === "club") return "Club"
    return null
  }, [searchParams])

  const stepsConfig = useMemo(() => (storeType ? getStepsForType(storeType) : []), [storeType])

  const rawStep = Number(searchParams.get("step")) || 1
  const currentStep = storeType
    ? clampStepToState(rawStep, storeType, storeStatus?.state ?? null)
    : rawStep

  const stateStep = useMemo(() => {
    if (!storeType || !storeStatus?.state) return null
    const preferred = preferredStepForState(storeType, storeStatus.state)
    return clampStepToState(preferred, storeType, storeStatus.state)
  }, [storeStatus?.state, storeType])

  const layoutStepIndex = storeType ? getLayoutStepIndex(storeType) : 2
  const productStepIndex = storeType ? getProductStepIndex(storeType) : 3

  const indicatorStep = stateStep ?? currentStep
  const stepIndicators: WizardStepIndicator[] = useMemo(
    () =>
      stepsConfig.map((step) => ({
        ...step,
        status:
          step.id < indicatorStep ? "completed" : step.id === indicatorStep ? "current" : "upcoming",
      })),
    [indicatorStep, stepsConfig]
  )

  const setUrlState = useCallback(
    ({
      step,
      type,
      clampStep = true,
    }: {
      step?: number
      type?: StoreType | null
      clampStep?: boolean
    }) => {
      const params = new URLSearchParams(searchParams.toString())
      const nextType = type ?? storeType ?? null

      if (nextType) params.set("type", nextType.toLowerCase())
      else params.delete("type")

      if (step !== undefined) {
        const normalized = clampStep
          ? clampStepToState(step, nextType, storeStatus?.state ?? null)
          : Math.max(1, step)
        params.set("step", String(normalized))
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams, storeType, storeStatus?.state]
  )

  const goToStep = useCallback(
    (step: number, options?: { clamp?: boolean }) => {
      setStepError(null)
      setUrlState({ step, clampStep: options?.clamp ?? true })
    },
    [setUrlState]
  )

  const goNextStep = useCallback(
    (options?: { clamp?: boolean }) => {
      goToStep(currentStep + 1, options)
    },
    [currentStep, goToStep]
  )

  const resetWizard = useCallback(
    (options?: { preserveType?: boolean }) => {
      setStoreStatus(null)
      setStepError(null)
      setResetSignal((value) => value + 1)
      if (!options?.preserveType) {
        setStoreType(null)
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(STORE_ID_STORAGE_KEY)
      }
    },
    []
  )

  const applyStoreSnapshot = useCallback(
    (snapshot: StoreProgress, options?: SnapshotSyncOptions) => {
      let nextSnapshot = snapshot

      if (options?.preventRegression && storeStatus?.state) {
        const currentRank = getStateRank(storeStatus.state)
        const nextRank = getStateRank(snapshot.state ?? storeStatus.state)
        if (nextRank < currentRank) {
          nextSnapshot = {
            ...snapshot,
            state: storeStatus.state,
          }
        }
      }

      setStoreStatus(nextSnapshot)
      setStoreType(nextSnapshot.type)
      if (typeof window !== "undefined" && nextSnapshot.id != null) {
        window.sessionStorage.setItem(STORE_ID_STORAGE_KEY, String(nextSnapshot.id))
      }

      const shouldSyncStep = options?.syncStep ?? true
      if (shouldSyncStep) {
        const snapshotState: StoreState = nextSnapshot.state ?? "CreateStore"
        const nextStep = options?.step ?? preferredStepForState(nextSnapshot.type, snapshotState)

        setUrlState({
          type: nextSnapshot.type,
          step: nextStep,
          clampStep: options?.clampStep ?? false,
        })
      }
    },
    [setUrlState, storeStatus?.state]
  )

  const handleStatusNotFound = useCallback(() => {
    resetWizard({ preserveType: true })
    setStoreType((prev) => prev ?? typeFromQuery ?? null)
  }, [resetWizard, typeFromQuery])

  const loadStatus = useCallback(
    async (options?: SnapshotSyncOptions): Promise<StoreProgress | null> => {
      try {
        const res = await getStoreStatus()
        if (!res) return null
        applyStoreSnapshot(res, options)
        return res
    } catch (error: any) {
      const status = error?.response?.status ?? error?.status
      if (status === 404) {
        handleStatusNotFound()
        return null
      }
      console.error("Failed to load store status", error)
      setStepError(extractErrorMessage(error, "Unable to load store status"))
      throw error
    }
  }, [applyStoreSnapshot, handleStatusNotFound])

  const reloadStatus = useCallback(async (options?: SnapshotSyncOptions) => {
    setLoadingStatus(true)
    try {
      return await loadStatus(options)
    } finally {
      setLoadingStatus(false)
    }
  }, [loadStatus])

  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    ;(async () => {
      setLoadingStatus(true)
      try {
        await loadStatus()
      } finally {
        setLoadingStatus(false)
      }
    })()
  }, [loadStatus])

  useEffect(() => {
    if (!storeStatus && typeFromQuery && storeType !== typeFromQuery) {
      setStoreType(typeFromQuery)
    }
  }, [storeStatus, storeType, typeFromQuery])

  const selectStoreType = useCallback(
    (type: StoreType) => {
      resetWizard()
      setStoreType(type)
      setUrlState({ type, step: 1, clampStep: false })
    },
    [resetWizard, setUrlState]
  )

  return {
    storeType,
    storeStatus,
    loadingStatus,
    stepError,
    setStepError,
    currentStep,
    stateStep,
    layoutStepIndex,
    productStepIndex,
    steps: stepIndicators,
    goToStep,
    goNextStep,
    reloadStatus,
    applyStoreSnapshot,
    selectStoreType,
    resetWizard,
    resetSignal,
  }
}
