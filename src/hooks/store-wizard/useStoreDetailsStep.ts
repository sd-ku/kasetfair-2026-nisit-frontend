"use client"

import { useCallback, useEffect, useState } from "react"
import { MediaPurpose } from "@/services/dto/media.dto"
import { uploadMedia } from "@/services/mediaService"
import { extractErrorMessage } from "@/services/storeServices"
import { updateDraftStore } from "@/services/storeDraftService"
import type { StoreWizardCore, StoreProgress } from "./store-wizard.core"
import type { GoodsType } from "@/services/dto/store-info.dto"

export type UseStoreDetailsStepResult = {
  layoutDescription: string
  layoutFile: File | null
  layoutFileName: string | null
  goodType: GoodsType | null
  isSaving: boolean
  setLayoutDescription: (value: string) => void
  setLayoutFile: (file: File | null) => void
  setGoodType: (value: GoodsType | null) => void
  saveAndContinue: () => Promise<void>
}

export function useStoreDetailsStep(core: StoreWizardCore): UseStoreDetailsStepResult {
  const { storeStatus, resetSignal, setStepError, goToStep, reloadStatus, goNextStep, isStoreAdmin } =
    core

  const [layoutDescription, setLayoutDescription] = useState("")
  const [layoutFile, setLayoutFileState] = useState<File | null>(null)
  const [storedLayoutFileName, setStoredLayoutFileName] = useState<string | null>(null)
  const [layoutMediaId, setLayoutMediaId] = useState<string | null>(null)
  const [goodType, setGoodType] = useState<GoodsType | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const setLayoutFile = useCallback((file: File | null) => {
    setLayoutFileState(file)
  }, [])

  const layoutFileName = layoutFile?.name ?? storedLayoutFileName

  const reset = useCallback(() => {
    setLayoutDescription("")
    setLayoutFileState(null)
    setStoredLayoutFileName(null)
    setLayoutMediaId(null)
    setGoodType(null)
    setIsSaving(false)
  }, [])

  useEffect(() => {
    reset()
  }, [reset, resetSignal])

  useEffect(() => {
    const snapshot = storeStatus as StoreProgress | null
    if (!snapshot) return

    if (typeof snapshot.layoutDescription === "string") {
      setLayoutDescription(snapshot.layoutDescription)
    }

    const serverFileName =
      typeof snapshot.layoutFileName === "string" && snapshot.layoutFileName.length > 0
        ? snapshot.layoutFileName
        : null

    setStoredLayoutFileName(serverFileName)
    if (serverFileName) {
      setLayoutFileState(null)
    }

    setLayoutMediaId(snapshot.boothMediaId ?? null)
    
    // Load goodType from storeStatus if available
    // StoreResponseDto includes goodType, but StoreProgress type may not explicitly include it
    if (storeStatus) {
      const storeWithGoodType = storeStatus as StoreProgress & { goodType?: GoodsType | null }
      if ('goodType' in storeWithGoodType) {
        setGoodType(storeWithGoodType.goodType ?? null)
      }
    }
  }, [storeStatus])

  const saveAndContinue = useCallback(async () => {
    const storeId = storeStatus?.id
    const storeState = storeStatus?.state ?? null

    if (!storeId || storeState === "CreateStore") {
      setStepError("Please create a store before saving store details.")
      goToStep(1, { clamp: false })
      return
    }

    if (!isStoreAdmin) {
      setStepError("Only the store admin can update store details.")
      return
    }

    if (storeState === "Pending") {
      setStepError("This store is pending review and cannot be edited.")
      return
    }

    if (!layoutFile && !layoutMediaId) {
      setStepError("Please upload a booth layout file before continuing.")
      return
    }

    setIsSaving(true)
    setStepError(null)

    try {
      let nextMediaId = layoutMediaId ?? null

      if (layoutFile) {
        const fileToUpload = layoutFile
        const media = await uploadMedia({
          purpose: MediaPurpose.STORE_BOOTH_LAYOUT,
          file: fileToUpload,
        })
        nextMediaId = media.id
        setLayoutMediaId(media.id)
        setStoredLayoutFileName(fileToUpload.name)
        setLayoutFileState(null)
      }

      if (!nextMediaId) {
        setStepError("Please upload a booth layout file before continuing.")
        return
      }

      await updateDraftStore({
        // storeId: String(storeId),
        boothMediaId: nextMediaId,
        ...(goodType !== null ? { goodType } : {}),
      })

      await reloadStatus()
      goNextStep({ clamp: false })
    } catch (error) {
      setStepError(extractErrorMessage(error, "Failed to save store layout"))
    } finally {
      setIsSaving(false)
    }
  }, [
    goNextStep,
    goToStep,
    isStoreAdmin,
    layoutFile,
    layoutMediaId,
    goodType,
    reloadStatus,
    setStepError,
    storeStatus,
  ])

  return {
    layoutDescription,
    layoutFile,
    layoutFileName,
    goodType,
    isSaving,
    setLayoutDescription,
    setLayoutFile,
    setGoodType,
    saveAndContinue,
  }
}
