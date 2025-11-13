"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CreateStoreRequestDto, StoreType } from "@/services/dto/store-info.dto"
import { memberEmailsDraftDto } from "@/services/dto/store-draft.dto"
import { createStore, extractErrorMessage } from "@/services/storeServices"
import { preferredStepForState } from "./store-wizard.config"
import type { StoreWizardCore } from "./store-wizard.core"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_MEMBERS = 3

const buildEmptyMembers = () => Array.from({ length: MIN_MEMBERS }, () => "")

export type UseCreateStoreStepResult = {
  storeName: string
  setStoreName: (value: string) => void
  members: string[]
  memberEmailStatuses: memberEmailsDraftDto[]
  isSubmitting: boolean
  selectStoreType: (type: StoreType) => void
  submitCreateStore: () => Promise<void>
  handleMemberChange: (index: number, value: string) => void
  addMember: () => void
  removeMember: (index: number) => void
}

export function useCreateStoreStep(core: StoreWizardCore): UseCreateStoreStepResult {
  const [storeName, setStoreName] = useState("")
  const [members, setMembers] = useState<string[]>(() => buildEmptyMembers())
  const [memberEmailStatuses, setMemberEmailStatuses] = useState<memberEmailsDraftDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetFields = useCallback(() => {
    setStoreName("")
    setMembers(buildEmptyMembers())
    setMemberEmailStatuses([])
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    resetFields()
  }, [resetFields, core.resetSignal])

  useEffect(() => {
    const snapshot = core.storeStatus
    if (!snapshot) return

    if (snapshot.storeName) {
      setStoreName(snapshot.storeName)
    }

    if (Array.isArray(snapshot.memberEmails)) {
      setMemberEmailStatuses(snapshot.memberEmails)
      const restored = snapshot.memberEmails.map((member) => member.email)
      while (restored.length < MIN_MEMBERS) restored.push("")
      setMembers(restored)
    }
  }, [core.storeStatus])

  const handleMemberChange = useCallback((index: number, value: string) => {
    setMembers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, ""])
  }, [])

  const removeMember = useCallback((index: number) => {
    setMembers((prev) => prev.filter((_, memberIndex) => memberIndex !== index))
  }, [])

  const selectStoreType = useCallback(
    (type: StoreType) => {
      resetFields()
      core.selectStoreType(type)
    },
    [core, resetFields]
  )

  const submitCreateStore = useCallback(async () => {
    if (!core.storeType) {
      core.setStepError("Please select a store type before creating a store.")
      return
    }

    if (core.storeStatus && core.storeStatus.state !== "CreateStore") {
      core.setStepError("This store has already been created.")
      core.goToStep(preferredStepForState(core.storeType, core.storeStatus.state), { clamp: false })
      return
    }

    const trimmedName = storeName.trim()
    const memberEmails = members.map((email) => email.trim()).filter(Boolean)

    if (!trimmedName) {
      core.setStepError("Please enter a store name.")
      return
    }
    if (memberEmails.length < MIN_MEMBERS) {
      core.setStepError(`Please provide at least ${MIN_MEMBERS} member emails.`)
      return
    }
    if (memberEmails.some((email) => !EMAIL_RE.test(email))) {
      core.setStepError("One or more member emails are invalid.")
      return
    }

    const payload: CreateStoreRequestDto = {
      storeName: trimmedName,
      type: core.storeType,
      memberGmails: memberEmails,
    }

    setIsSubmitting(true)
    core.setStepError(null)

    try {
      const response = await createStore(payload)
      core.applyStoreSnapshot(response)
      await core.reloadStatus().catch((reloadError) => {
        console.error("Failed to reload store status after creation", reloadError)
      })
    } catch (error) {
      core.setStepError(extractErrorMessage(error, "Failed to create store"))
    } finally {
      setIsSubmitting(false)
    }
  }, [core, members, storeName])

  return {
    storeName,
    setStoreName,
    members,
    memberEmailStatuses,
    isSubmitting,
    selectStoreType,
    submitCreateStore,
    handleMemberChange,
    addMember,
    removeMember,
  }
}
