
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CreateStoreRequestDto, StoreType } from "@/services/dto/store-info.dto"
import { MemberEmailsDraftDto } from "@/services/dto/store-draft.dto"
import { extractErrorMessage } from "@/services/storeServices"
import {
  createStore,
  updateDraftStore
} from "@/services/storeDraftService"
import type { StoreWizardCore } from "./store-wizard.core"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_MEMBERS = 3

const buildEmptyMembers = () => Array.from({ length: MIN_MEMBERS }, () => "")

const padMembers = (emails: string[]): string[] => {
  const normalized = emails.map((email) => email.trim())
  while (normalized.length < MIN_MEMBERS) normalized.push("")
  return normalized
}

const mergeMemberStatuses = (
  emails: string[],
  missingProfileEmails: string[],
  previous: MemberEmailsDraftDto[]
): MemberEmailsDraftDto[] => {
  if (!emails.length) return []
  const missingSet = new Set(missingProfileEmails.map((email) => email.trim().toLowerCase()))
  const previousMap = previous.reduce<Map<string, MemberEmailsDraftDto>>((acc, entry) => {
    acc.set(entry.email.trim().toLowerCase(), entry)
    return acc
  }, new Map())

  return emails.map((email) => {
    const key = email.trim().toLowerCase()
    if (missingSet.has(key)) {
      return { email, status: "missing profile" }
    }
    return previousMap.get(key) ?? { email, status: "pending" }
  })
}

export type UseCreateStoreStepResult = {
  storeName: string
  setStoreName: (value: string) => void
  members: string[]
  memberEmailStatuses: MemberEmailsDraftDto[]
  isSubmitting: boolean
  isStoreAdmin: boolean
  canEdit: boolean
  selectStoreType: (type: StoreType) => void
  submitCreateStore: () => Promise<void>
  handleMemberChange: (index: number, value: string) => void
  addMember: () => void
  removeMember: (index: number) => void
}

export function useCreateStoreStep(core: StoreWizardCore): UseCreateStoreStepResult {
  const [storeName, setStoreName] = useState("")
  const [members, setMembers] = useState<string[]>(() => buildEmptyMembers())
  const [memberEmailStatuses, setMemberEmailStatuses] = useState<MemberEmailsDraftDto[]>([])
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
      setMembers(padMembers(restored))
      return
    }

    const snapshotWithMembers = snapshot as unknown as {
      members?: { email: string; status: string }[]
    }
    if (Array.isArray(snapshotWithMembers.members)) {
      setMemberEmailStatuses(snapshotWithMembers.members)
      const restored = snapshotWithMembers.members.map((member) => member.email)
      setMembers(padMembers(restored))
    }
  }, [core.storeStatus])

  const handleMemberChange = useCallback(
    (index: number, value: string) => {
      if (core.storeStatus && !core.isStoreAdmin) return
      setMembers((prev) => {
        const next = [...prev]
        next[index] = value
        return next
      })
    },
    [core.isStoreAdmin, core.storeStatus]
  )

  const addMember = useCallback(() => {
    if (core.storeStatus && !core.isStoreAdmin) return
    setMembers((prev) => [...prev, ""])
  }, [core.isStoreAdmin, core.storeStatus])

  const removeMember = useCallback(
    (index: number) => {
      if (core.storeStatus && !core.isStoreAdmin) return
      setMembers((prev) => prev.filter((_, memberIndex) => memberIndex !== index))
    },
    [core.isStoreAdmin, core.storeStatus]
  )

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

    const canEditStore = !core.storeStatus || core.isStoreAdmin
    if (!canEditStore) {
      core.setStepError("Only the store admin can update store information.")
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

    const hasExistingStore = Boolean(core.storeStatus)

    if (hasExistingStore) {
      setIsSubmitting(true)
      core.setStepError(null)

      try {
        const response = await updateDraftStore({
          storeName: trimmedName,
          memberEmails,
        })

        setStoreName(response.storeName)
        setMembers(padMembers(response.memberEmails))
        setMemberEmailStatuses((prev) =>
          mergeMemberStatuses(response.memberEmails, response.missingProfileEmails ?? [], prev)
        )

        await core.reloadStatus().catch((reloadError) => {
          console.error("Failed to reload store status after updating draft", reloadError)
        })
      } catch (error) {
        core.setStepError(extractErrorMessage(error, "Failed to update store members"))
      } finally {
        setIsSubmitting(false)
      }

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
    isStoreAdmin: core.isStoreAdmin,
    canEdit: !core.storeStatus || core.isStoreAdmin,
  }
}
