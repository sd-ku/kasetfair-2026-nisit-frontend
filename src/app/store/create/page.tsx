"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/createStep/step-indicator"
import { StepOneForm } from "@/components/createStep/step-one-form"
import { StepClubInfoForm } from "@/components/createStep/step-club-form"
import { StepTwoForm } from "@/components/createStep/step-two-form"
import { StepThreeForm } from "@/components/createStep/step-three-form"
import {
  CreateStoreRequestDto,
  CreateStoreResponseDto,
  StoreState,
  StoreStatusRequestDto,
  StoreStatusResponseDto,
  StoreType,
} from "@/services/dto/store-info.dto"
import {
  createStore,
  extractErrorMessage,
  getStoreStatus,
  getStoreDraft,
} from "@/services/storeServices"

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_MEMBERS = 3
const STORE_ID_STORAGE_KEY = "kasetfair-active-store-id"

type ProductFormState = {
  id: string
  name: string
  price: string
  file: File | null
  fileName: string | null
}

type ClubInfoState = {
  organizationName: string
  presidentFirstName: string
  presidentLastName: string
  presidentStudentId: string
  applicationFile: File | null
  applicationFileName: string | null
}

type StoreProgress = CreateStoreResponseDto | StoreStatusResponseDto

const STEP_LABELS = {
  createStore: "Create store",
  storeDetails: "Store information",
  productDetails: "Product information",
} as const

const STEP_CONFIG_BY_TYPE: Record<StoreType, Array<{ id: number; label: string }>> = {
  Nisit: [
    { id: 1, label: STEP_LABELS.createStore },
    { id: 2, label: STEP_LABELS.storeDetails },
    { id: 3, label: STEP_LABELS.productDetails },
  ],
  Club: [
    { id: 1, label: STEP_LABELS.createStore },
    { id: 2, label: "Student organization details" },
    { id: 3, label: STEP_LABELS.storeDetails },
    { id: 4, label: STEP_LABELS.productDetails },
  ],
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
  presidentStudentId: "",
  applicationFile: null,
  applicationFileName: null,
}

const getLayoutStepIndex = (type: StoreType) => (type === "Club" ? 3 : 2)
const getProductStepIndex = (type: StoreType) => (type === "Club" ? 4 : 3)
const getStepsForType = (type: StoreType) => STEP_CONFIG_BY_TYPE[type]

const clampStepToState = (step: number, type: StoreType | null, state: StoreState | null): number => {
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
    case "Submitted":
      maxStep = getStepsForType(type).length
      break
    default:
      maxStep = 1
  }

  if (Number.isFinite(maxStep)) {
    return Math.max(1, Math.min(step, maxStep))
  }

  return Math.max(1, step)
}

const preferredStepForState = (type: StoreType, state: StoreState): number => {
  switch (state) {
    case "CreateStore":
      return 1
    case "StoreDetails":
      return type === "Club" ? 2 : getLayoutStepIndex(type)
    case "ProductDetails":
    case "Submitted":
      return getProductStepIndex(type)
    default:
      return 1
  }
}

// map step number → draft section key ที่ backend รองรับ
const stepToDraftKey = (type: StoreType, step: number): string | null => {
  // step 1 = create store (ปกติไม่ต้องดึงอะไรพิเศษ)
  if (step === 1) return "create-store"

  // ถ้าเป็น Club, step 2 คือข้อมูลชมรม
  if (type === "Club" && step === 2) return "club-info"

  // ขั้นของรายละเอียดร้าน/เลย์เอาต์
  if (step === getLayoutStepIndex(type)) return "store-details"

  // ขั้นของสินค้า/สินค้า
  if (step === getProductStepIndex(type)) return "product-details"

  return null
}

export default function StoreCreatePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const typeFromQuery = useMemo<StoreType | null>(() => {
    const raw = searchParams.get("type")
    if (!raw) return null
    const normalized = raw.toLowerCase()
    if (normalized === "nisit") return "Nisit"
    if (normalized === "club") return "Club"
    return null
  }, [searchParams])

  const [storeType, setStoreType] = useState<StoreType | null>(typeFromQuery)
  const [storeStatus, setStoreStatus] = useState<StoreProgress | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const steps = useMemo(() => (storeType ? getStepsForType(storeType) : []), [storeType])
  const layoutStepIndex = storeType ? getLayoutStepIndex(storeType) : 2
  const productStepIndex = storeType ? getProductStepIndex(storeType) : 3

  const allowedStep = clampStepToState(
    steps.length || 1,
    storeType,
    storeStatus?.state ?? null
  )

  const rawStep = Number(searchParams.get("step")) || 1
  const currentStep = storeType ? clampStepToState(rawStep, storeType, storeStatus?.state ?? null) : rawStep

  const [storeName, setStoreName] = useState("")
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
  const [saving, setSaving] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

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
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORE_ID_STORAGE_KEY)
    }
  }, [])

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

      if (nextType) {
        params.set("type", nextType.toLowerCase())
      } else {
        params.delete("type")
      }

      if (step !== undefined) {
        const normalizedStep = clampStep
          ? clampStepToState(step, nextType, storeStatus?.state ?? null)
          : Math.max(1, step)
        params.set("step", String(normalizedStep))
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

  const handleStepOne = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!storeType) return;

    let cancelled = false;
    const draftKey = stepToDraftKey(storeType, currentStep);

    try {
      setLoadingStatus(true);

      const res = draftKey ? await getStoreDraft(draftKey) : null;
      if (cancelled) return;

      if (!res || !res.id) {
        setStoreStatus(null);
        setStoreType(null as any);
        setStoreName("");
        setUrlState({ type: undefined as any, step: 1, clampStep: false });
        window.sessionStorage.removeItem(STORE_ID_STORAGE_KEY);
        return;
      }

      setStoreStatus(res);
      setStoreType(res.type);
      setStoreName(res.storeName ?? "");
      const base = res.memberEmails.map(e => e.email)
      while (base.length < MIN_MEMBERS) base.push("")
      setMembers(base)
      setMemberEmailStatuses(res.memberEmails)
      window.sessionStorage.setItem(STORE_ID_STORAGE_KEY, String(res.id));
      setUrlState({
        type: res.type,
        step: preferredStepForState(res.type, res.state),
        clampStep: false,
      });
    } catch (error) {
      if (cancelled) return;
      console.error("Failed to recover store status", error);
      setStepError(extractErrorMessage(error, "Unable to recover store progress"));
      window.sessionStorage.removeItem(STORE_ID_STORAGE_KEY);
    } finally {
      if (cancelled) return;
      setLoadingStatus(false);
    }

    return () => {
      cancelled = true;
    };
  }, [storeType, currentStep]);

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
    const memberEmails = members.map((email) => email.trim()).filter((email) => email.length > 0)

    if (!trimmedName) {
      setStepError("Please enter a store name.")
      return
    }

    if (memberEmails.length < MIN_MEMBERS) {
      setStepError(`Please provide at least ${MIN_MEMBERS} member emails.`)
      return
    }

    if (memberEmails.some((email) => !emailRe.test(email))) {
      setStepError("One or more member emails are invalid.")
      return
    }

    const payload: CreateStoreRequestDto = {
      storeName: trimmedName,
      type: storeType,
      memberGmails: memberEmails,
    }

    setSaving(true)
    setStepError(null)

    try {
      const response = await createStore(payload)
      setStoreStatus(response)
      setStoreType(response.type)
      setStoreName(response.storeName)
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORE_ID_STORAGE_KEY, String(response.id))
      }
      setUrlState({
        type: response.type,
        step: preferredStepForState(response.type, response.state),
        clampStep: false,
      })
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to create store")
      setStepError(message)
    } finally {
      setSaving(false)
    }
  }, [members, storeName, storeStatus, storeType, updateStepParam, setUrlState])

  const handleMemberChange = (index: number, value: string) => {
    setMembers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddMember = () => {
    setMembers((prev) => [...prev, ""])
  }

  const handleRemoveMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClubInfoFieldChange = (
    key: keyof Omit<ClubInfoState, "applicationFile" | "applicationFileName">,
    value: string
  ) => {
    setClubInfo((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleClubApplicationFileChange = (file: File | null) => {
    setClubInfo((prev) => ({
      ...prev,
      applicationFile: file,
      applicationFileName: file ? file.name : null,
    }))
  }

  const handleProductChange = (id: string, field: "name" | "price", value: string) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, [field]: value } : product))
    )
  }

  const handleProductFileChange = (id: string, file: File | null) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              file,
              fileName: file ? file.name : null,
            }
          : product
      )
    )
  }

  const handleAddProduct = () => {
    setProducts((prev) => [...prev, createProduct()])
  }

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => (prev.length === 1 ? prev : prev.filter((product) => product.id !== id)))
  }

  const handleSimulatedSave = async (targetStep: number, options?: { clamp?: boolean }) => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    setSaving(false)
    updateStepParam(targetStep, options)
  }

  const handleFinalSubmit = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    console.log("Store draft submitted", {
      storeStatus,
      storeName,
      members,
      layoutDescription,
      layoutFile,
      products,
    })
    setSaving(false)
  }

  const handleSelectStoreType = (type: StoreType) => {
    resetFormState()
    setStoreType(type)
    setUrlState({ type, step: 1, clampStep: false })
  }

  useEffect(() => {
    if (storeType && rawStep !== currentStep) {
      updateStepParam(currentStep)
    }
  }, [currentStep, rawStep, storeType, updateStepParam])

  useEffect(() => {
    if (currentStep === 1) {
      handleStepOne();
    }
  }, [currentStep, handleStepOne]);

  const allowCreateSubmit = !storeStatus || storeStatus.state === "CreateStore"

  const stepStatuses = steps.map((step) => ({
    id: step.id,
    label: step.label,
    status:
      step.id < currentStep ? "completed" : step.id === currentStep ? "current" : "upcoming",
  })) as Array<{ id: number; label: string; status: "completed" | "current" | "upcoming" }>

  if (!storeType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl bg-white/80 p-10 text-center shadow-xl ring-1 ring-emerald-100">
          <h1 className="text-2xl font-semibold text-emerald-900">Choose a store type before starting</h1>
          {loadingStatus ? (
            <p className="text-sm text-emerald-700">Loading your latest store progress...</p>
          ) : (
            <>
              <p className="text-sm text-emerald-700">
                Pick whether you are registering a student-run store or a student organization store so
                the form matches your requirements.
              </p>
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <Button
                  className="w-full justify-start gap-3 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => handleSelectStoreType("Nisit")}
                >
                  Student store
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleSelectStoreType("Club")}
                >
                  Organization store
                </Button>
              </div>
              <Button
                variant="ghost"
                className="text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push("/home")}
              >
                Back to home
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">Kaset Fair store registration</h1>
            <p className="mt-2 text-sm text-emerald-700">
              Complete the steps below to submit your store application. You can return later and continue
              from where you left off.
            </p>
            {storeStatus && (
              <p className="mt-2 text-xs uppercase tracking-wide text-emerald-600">
                Current state: {storeStatus.state}
              </p>
            )}
          </div>
          <StepIndicator steps={stepStatuses} />
        </header>

        {currentStep === 1 && (
          <StepOneForm
            storeName={storeName}
            members={members}
            memberEmailStatuses={memberEmailStatuses}
            onStoreNameChange={setStoreName}
            onMemberChange={handleMemberChange}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onNext={handleCreateStore}
            saving={saving}
            canSubmit={allowCreateSubmit}
            errorMessage={stepError}
          />
        )}

        {storeType === "Club" && currentStep === 2 && (
          <StepClubInfoForm
            organizationName={clubInfo.organizationName}
            presidentFirstName={clubInfo.presidentFirstName}
            presidentLastName={clubInfo.presidentLastName}
            presidentStudentId={clubInfo.presidentStudentId}
            applicationFileName={clubInfo.applicationFileName}
            onOrganizationNameChange={(value) => handleClubInfoFieldChange("organizationName", value)}
            onPresidentFirstNameChange={(value) => handleClubInfoFieldChange("presidentFirstName", value)}
            onPresidentLastNameChange={(value) => handleClubInfoFieldChange("presidentLastName", value)}
            onPresidentStudentIdChange={(value) => handleClubInfoFieldChange("presidentStudentId", value)}
            onApplicationFileChange={handleClubApplicationFileChange}
            onBack={() => updateStepParam(currentStep - 1)}
            onNext={() => handleSimulatedSave(currentStep + 1)}
            saving={saving}
          />
        )}

        {currentStep === layoutStepIndex && (
          <StepTwoForm
            layoutDescription={layoutDescription}
            layoutFileName={layoutFile?.name ?? null}
            onDescriptionChange={setLayoutDescription}
            onFileChange={setLayoutFile}
            onBack={() => updateStepParam(currentStep - 1)}
            onNext={() => handleSimulatedSave(currentStep + 1)}
            saving={saving}
          />
        )}

        {currentStep === productStepIndex && (
          <StepThreeForm
            products={products.map(({ id, name, price, fileName }) => ({
              id,
              name,
              price,
              fileName,
            }))}
            onProductChange={handleProductChange}
            onProductFileChange={handleProductFileChange}
            onAddProduct={handleAddProduct}
            onRemoveProduct={handleRemoveProduct}
            onBack={() => updateStepParam(currentStep - 1)}
            onSubmitAll={handleFinalSubmit}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}
