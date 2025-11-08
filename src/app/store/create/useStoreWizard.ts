// useStoreWizard.ts
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CreateStoreRequestDto,
  CreateStoreResponseDto,
  StoreState,
  StoreStatusResponseDto,
  StoreType,
} from "@/services/dto/store-info.dto"
import { createStore, extractErrorMessage, getStoreDraft, getStoreStatus, updateClubInfo } from "@/services/storeServices"
import {
  CLUB_INFO_REQUEST_FIELD_MAP,
  CLUB_INFO_REQUIRED_FIELDS,
  type ClubInfoFieldKey,
  clampStepToState,
  getLayoutStepIndex,
  getProductStepIndex,
  getStepsForType,
  preferredStepForState,
  stepToDraftKey,
} from "./store-wizard.config"

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_MEMBERS = 3
const STORE_ID_STORAGE_KEY = "kasetfair-active-store-id"

export type ProductFormState = {
  id: string
  name: string
  price: string
  file: File | null
  fileName: string | null
}

type ClubInfoBaseState = Record<Exclude<ClubInfoFieldKey, "applicationFileName">, string>

export type ClubInfoState = ClubInfoBaseState & {
  applicationFileName: string | null
}

const createProduct = (): ProductFormState => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `product-${Math.random().toString(16).slice(2)}`,
  name: "",
  price: "",
  file: null,
  fileName: null,
})

const emptyClubInfo: ClubInfoState = {
  organizationName: "",
  presidentFirstName: "",
  presidentLastName: "",
  presidentNisitId: "",
  presidentEmail: "",
  presidentPhone: "",
  applicationFileName: null,
}

type StoreProgress = CreateStoreResponseDto | StoreStatusResponseDto
type UpdateClubInfoPayload = Parameters<typeof updateClubInfo>[0]

const clubInfoFieldEntries = Object.entries(CLUB_INFO_REQUEST_FIELD_MAP) as Array<
  [ClubInfoFieldKey, keyof UpdateClubInfoPayload]
>

const mapClubInfoToPayload = (info: ClubInfoState): UpdateClubInfoPayload =>
  clubInfoFieldEntries.reduce((acc, [stateKey, requestKey]) => {
    const rawValue = info[stateKey]
    if (rawValue == null) {
      return acc
    }

    const normalizedValue =
      typeof rawValue === "string" && stateKey !== "applicationFileName"
        ? rawValue.trim()
        : rawValue

    if (typeof normalizedValue === "string" && normalizedValue.length > 0) {
      acc[requestKey] = normalizedValue
    }

    return acc
  }, {} as UpdateClubInfoPayload)

export function useStoreWizard() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [storeType, setStoreType] = useState<StoreType | null>(null)
  const [storeStatus, setStoreStatus] = useState<StoreProgress | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  const [storeName, setStoreName] = useState("")
  // Step-One
  const [members, setMembers] = useState<string[]>(Array.from({ length: MIN_MEMBERS }, () => ""))
  const [memberEmailStatuses, setMemberEmailStatuses] = useState<
    Array<{ email: string; status: string }>
  >([])
  const [layoutDescription, setLayoutDescription] = useState("")
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [clubInfo, setClubInfo] = useState<ClubInfoState>(emptyClubInfo)
  const [products, setProducts] = useState<ProductFormState[]>([
    createProduct(),
    createProduct(),
    createProduct(),
  ])

  const typeFromQuery = useMemo<StoreType | null>(() => {
    const raw = searchParams.get("type")
    if (!raw) return null
    const n = raw.toLowerCase()
    if (n === "nisit") return "Nisit"
    if (n === "club") return "Club"
    return null
  }, [searchParams])

  const steps = useMemo(
    () => (storeType ? getStepsForType(storeType) : []),
    [storeType]
  )

  const rawStep = Number(searchParams.get("step")) || 1
  const currentStep = storeType
    ? clampStepToState(rawStep, storeType, storeStatus?.state ?? null)
    : rawStep

  const layoutStepIndex = storeType ? getLayoutStepIndex(storeType) : 2
  const productStepIndex = storeType ? getProductStepIndex(storeType) : 3

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

  const updateStepParam = useCallback(
    (step: number, options?: { clamp?: boolean }) => {
      setStepError(null)
      setUrlState({ step, clampStep: options?.clamp ?? true })
    },
    [setUrlState]
  )

  const applyStoreSnapshot = useCallback((snapshot: StoreProgress) => {
    // เก็บ snapshot สด
    setStoreStatus(snapshot)
    setStoreType(snapshot.type)

    // ---- ชื่อร้าน (ทุก state หลังสร้างควรมีได้) ----
    if (snapshot.storeName) {
      setStoreName(snapshot.storeName)
    }

    // ---- สมาชิก (ใช้ตอน state: CreateStore ขึ้นไป) ----
    if ("memberEmails" in snapshot && Array.isArray(snapshot.memberEmails)) {
      setMemberEmailStatuses(snapshot.memberEmails)

      const base = snapshot.memberEmails.map((m) => m.email)
      while (base.length < MIN_MEMBERS) base.push("")
      setMembers(base)
    }

    // ---- ข้อมูลชมรม (เฉพาะร้านแบบ Club และ state >= ClubInfo) ----
    const anySnap: any = snapshot

    if (snapshot.type === "Club" && anySnap.clubInfo) {
      const ci = anySnap.clubInfo
      setClubInfo({
        organizationName: ci.organizationName ?? "",
        presidentFirstName: ci.presidentFirstName ?? "",
        presidentLastName: ci.presidentLastName ?? "",
        presidentNisitId: ci.presidentNisitId ?? "",
        presidentEmail: ci.presidentEmail ?? "",
        presidentPhone: ci.presidentPhone ?? "",
        applicationFileName: ci.applicationFileName ?? null,
      })
    }

    // ---- รายละเอียดเลย์เอาต์ / store details (state >= StoreDetails) ----
    if (typeof anySnap.layoutDescription === "string") {
      setLayoutDescription(anySnap.layoutDescription)
    }

    if (typeof anySnap.layoutFileName === "string" && anySnap.layoutFileName) {
      // ฝั่ง frontend เก็บแค่ชื่อให้ user เห็นว่าเคยอัปโหลดอะไร
      setLayoutFile(null)
      // ถ้าต้องการโชว์ชื่อไฟล์อย่างเดียวอาจต้อง refactor ให้มี layoutFileName แยกเหมือน products
    }

    // ---- สินค้า (state >= ProductDetails) ----
    if (Array.isArray(anySnap.products)) {
      const mapped: ProductFormState[] = anySnap.products.map((p: any, idx: number) => ({
        id: p.id?.toString?.() ?? `server-${idx}`,
        name: p.name ?? "",
        price: p.price != null ? String(p.price) : "",
        file: null, // เอาไฟล์จริงกลับมาไม่ได้จาก backend — โชว์แค่ชื่อ
        fileName: p.fileName ?? p.imageName ?? null,
      }))

      setProducts(mapped.length ? mapped : [createProduct(), createProduct(), createProduct()])
    }
  }, [])

  // init from /status
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    ;(async () => {
      try {
        const res = await getStoreStatus()
        if (!res) return

        applyStoreSnapshot(res)

        // setStoreStatus(res)
        // setStoreType(res.type)
        // setStoreName(res.storeName ?? "")

        window.sessionStorage.setItem(STORE_ID_STORAGE_KEY, String(res.id))
        
        setUrlState({
          type: res.type,
          step: preferredStepForState(res.type, res.state),
          clampStep: false,
        })
      } catch (error: any) {
        const status = error?.response?.status ?? error?.status
        
        if (status === 404) {
          setStoreStatus(null)
          setStoreType(typeFromQuery ?? null)
          window.sessionStorage.removeItem(STORE_ID_STORAGE_KEY)
          return
        }
        console.error("Failed to load store status", error)
        setStepError(extractErrorMessage(error, "Unable to load store status"))
      }
    })()
  }, [applyStoreSnapshot, setUrlState, typeFromQuery])

  // ensure storeType sync with query whenไม่มี status
  useEffect(() => {
    if (!storeStatus && typeFromQuery && storeType !== typeFromQuery) {
      setStoreType(typeFromQuery)
    }
  }, [storeStatus, storeType, typeFromQuery])

  const resetFormState = useCallback(() => {
    setStoreStatus(null)
    setStoreName("")
    setMembers(Array.from({ length: MIN_MEMBERS }, () => ""))
    setLayoutDescription("")
    setLayoutFile(null)
    setClubInfo(emptyClubInfo)
    setProducts([createProduct(), createProduct(), createProduct()])
    setStepError(null)
    window.sessionStorage.removeItem(STORE_ID_STORAGE_KEY)
  }, [])

  const handleSelectStoreType = (type: StoreType) => {
    resetFormState()
    setStoreType(type)
    setUrlState({ type, step: 1, clampStep: false })
  }

  const handleCreateStore = useCallback(async () => {
    if (!storeType) {
      setStepError("Please select a store type before creating a store.")
      return
    }

    if (storeStatus && storeStatus.state !== "CreateStore") {
      setStepError("This store has already been created.")
      updateStepParam(preferredStepForState(storeType, storeStatus.state), { clamp: false })
      return
    }

    const trimmedName = storeName.trim()
    const memberEmails = members.map((e) => e.trim()).filter(Boolean)

    if (!trimmedName) return setStepError("Please enter a store name.")
    if (memberEmails.length < MIN_MEMBERS)
      return setStepError(`Please provide at least ${MIN_MEMBERS} member emails.`)
    if (memberEmails.some((email) => !emailRe.test(email)))
      return setStepError("One or more member emails are invalid.")

    const payload: CreateStoreRequestDto = {
      storeName: trimmedName,
      type: storeType,
      memberGmails: memberEmails,
    }

    setSaving(true)
    setStepError(null)

    try {
      const res = await createStore(payload)

      applyStoreSnapshot(res)
      //   setStoreStatus(res)
    //   setStoreType(res.type)
    //   setStoreName(res.storeName)
      window.sessionStorage.setItem(STORE_ID_STORAGE_KEY, String(res.id))
      setUrlState({
        type: res.type,
        step: preferredStepForState(res.type, res.state),
        clampStep: false,
      })
    } catch (error) {
      setStepError(extractErrorMessage(error, "Failed to create store"))
    } finally {
      setSaving(false)
    }
  }, [
    members,
    storeName,
    storeStatus,
    storeType,
    applyStoreSnapshot,
    updateStepParam,
    setUrlState
  ])

  const handleClubInfoFieldChange = (
    key: keyof ClubInfoState,
    value: string
  ) => {
    setClubInfo((prev) => ({ ...prev, [key]: value }))
  }

  const handleClubApplicationFileChange = (file: File | null) => {
    setClubInfo((prev) => ({
      ...prev,
      applicationFileName: file ? file.name : null,
    }))
  }

  const handleSaveClubInfo = useCallback(async () => {
    if (storeType !== "Club") {
      updateStepParam(currentStep + 1, { clamp: false })
      return
    }

    if (!storeStatus || storeStatus.state === "CreateStore") {
      setStepError("Please create a store before submitting club information.")
      updateStepParam(1, { clamp: false })
      return
    }

    const missingField = CLUB_INFO_REQUIRED_FIELDS.find((field) => !clubInfo[field].trim())
    if (missingField) {
      setStepError("Please fill in all required club information.")
      return
    }

    const payload = mapClubInfoToPayload(clubInfo)

    setSaving(true)
    setStepError(null)

    try {
      const res = await updateClubInfo(payload)
      applyStoreSnapshot(res)
      updateStepParam(currentStep + 1, { clamp: false })
    } catch (error) {
      setStepError(extractErrorMessage(error, "Failed to save club information"))
    } finally {
      setSaving(false)
    }
  }, [
    applyStoreSnapshot,
    clubInfo,
    currentStep,
    storeStatus,
    storeType,
    updateStepParam,
    setStepError,
  ])

  const handleSimulatedSave = async (targetStep: number, options?: { clamp?: boolean }) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 250))
    setSaving(false)
    updateStepParam(targetStep, options)
  }

  const handleFinalSubmit = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    console.log("Store draft submitted", {
      storeStatus,
      storeName,
      members,
      layoutDescription,
      layoutFile,
      products,
      clubInfo,
    })
    setSaving(false)
  }

  const stepIndicator = steps.map((step) => ({
    id: step.id,
    label: step.label,
    status:
      step.id < currentStep
        ? "completed"
        : step.id === currentStep
        ? "current"
        : "upcoming",
  }))

  return {
    // meta
    storeType,
    storeStatus,
    loadingStatus,
    saving,
    stepError,
    currentStep,
    layoutStepIndex,
    productStepIndex,
    steps: stepIndicator,

    // fields
    storeName,
    setStoreName,
    members,
    setMembers,
    memberEmailStatuses,
    layoutDescription,
    setLayoutDescription,
    layoutFile,
    setLayoutFile,
    clubInfo,
    products,
    setProducts,

    // handlers
    handleSelectStoreType,
    handleCreateStore,
    handleClubInfoFieldChange,
    handleClubApplicationFileChange,
    handleSaveClubInfo,
    handleSimulatedSave,
    handleFinalSubmit,
    updateStepParam,
    setStepError,

    // member handlers (optional sugar)
    handleMemberChange(index: number, value: string) {
      setMembers((prev) => {
        const next = [...prev]
        next[index] = value
        return next
      })
    },
    handleAddMember() {
      setMembers((prev) => [...prev, ""])
    },
    handleRemoveMember(index: number) {
      setMembers((prev) => prev.filter((_, i) => i !== index))
    },

    handleProductChange(id: string, field: "name" | "price", value: string) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      )
    },
    handleProductFileChange(id: string, file: File | null) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, file, fileName: file ? file.name : null }
            : p
        )
      )
    },
    handleAddProduct() {
      setProducts((prev) => [...prev, createProduct()])
    },
    handleRemoveProduct(id: string) {
      setProducts((prev) =>
        prev.length === 1 ? prev : prev.filter((p) => p.id !== id)
      )
    },
  }
}
