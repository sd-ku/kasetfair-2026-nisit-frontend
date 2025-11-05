"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { StoreType } from "@/services/dto/store-info.dto"
import { StepIndicator } from "@/components/createStep/step-indicator"
import { StepOneForm } from "@/components/createStep/step-one-form"
import { StepClubInfoForm } from "@/components/createStep/step-club-form"
import { StepTwoForm } from "@/components/createStep/step-two-form"
import { StepThreeForm } from "@/components/createStep/step-three-form"
import { createStore } from "@/services/storeServices"

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

const MIN_MEMBERS = 3

const createProduct = (): ProductFormState => ({
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `product-${Math.random().toString(16).slice(2)}`,
  name: "",
  price: "",
  file: null,
  fileName: null,
})

export default function StoreCreatePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const storeType = useMemo<StoreType | null>(() => {
    const raw = searchParams.get("type")
    if (!raw) return null
    const normalized = raw.toLowerCase()
    if (normalized === "nisit") return "Nisit"
    if (normalized === "club") return "Club"
    return null
  }, [searchParams])

  const steps = useMemo(() => (storeType ? STEP_CONFIG_BY_TYPE[storeType] : []), [storeType])
  const totalSteps = steps.length || 1
  const layoutStepIndex = storeType === "Club" ? 3 : 2
  const productStepIndex = storeType === "Club" ? 4 : 3

  const currentStep = useMemo(() => {
    const raw = Number(searchParams.get("step")) || 1
    if (raw < 1) return 1
    if (raw > totalSteps) return totalSteps
    return raw
  }, [searchParams, totalSteps])

  const [storeName, setStoreName] = useState("")
  const [members, setMembers] = useState<string[]>(
    Array.from({ length: MIN_MEMBERS }, () => "")
  )
  const [layoutDescription, setLayoutDescription] = useState("")
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [clubInfo, setClubInfo] = useState<ClubInfoState>({
    organizationName: "",
    presidentFirstName: "",
    presidentLastName: "",
    presidentStudentId: "",
    applicationFile: null,
    applicationFileName: null,
  })
  const [storeId, setStoreId] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductFormState[]>([createProduct(), createProduct(), createProduct()])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const stepStatuses = steps.map((step) => ({
    id: step.id,
    label: step.label,
    status:
      step.id < currentStep ? "completed" : step.id === currentStep ? "current" : "upcoming",
  })) as Array<{ id: number; label: string; status: "completed" | "current" | "upcoming" }>

  const updateStepParam = useCallback(
    (step: number) => {
      const next = Math.max(1, Math.min(totalSteps, step))
      const params = new URLSearchParams(searchParams.toString())
      params.set("step", String(next))
      if (storeType) {
        params.set("type", storeType)
      }
      const queryString = params.toString()
      router.replace(`${pathname}?${queryString}`, { scroll: false })
    },
    [pathname, router, searchParams, storeType, totalSteps]
  )

  const handleCreateStore = useCallback(async () => {
    setErrorMsg(null);

    if (!storeName.trim()) {
      setErrorMsg("กรุณากรอกชื่อร้าน");
      throw new Error("STORE_NAME_REQUIRED");
    }
    const filled = members.map(m => m.trim()).filter(Boolean)
    if (filled.length < MIN_MEMBERS) {
      setErrorMsg(`กรุณากรอกอีเมลสมาชิกอย่างน้อย ${MIN_MEMBERS} คน`);
      throw new Error("MEMBER_MIN_REQUIRED");
    }
    for (let i = 0; i < Math.min(MIN_MEMBERS, filled.length); i++) {
      if (!emailRe.test(filled[i].trim())) {
        setErrorMsg(`รูปแบบอีเมลสมาชิกคนที่ ${i + 1} ไม่ถูกต้อง`);
        throw new Error("INVALID_EMAIL");
      }
    }
    if (!storeType) {
      setErrorMsg("กรุณาเลือกประเภทร้าน");
      return;
      // throw new Error("STORE_TYPE_REQUIRED");
    }

    setSaving(true);
    try {

      // คุณอาจแนบ Idempotency-Key เพื่อกันกดซ้ำ
      // ตัวอย่าง: http.post(url, body, { headers: { "Idempotency-Key": crypto.randomUUID() } })
      // console.log("start create store")
      const res = await createStore({
        storeName: storeName.trim(),
        type: storeType,      // "Nisit" | "Club"
        memberGmails: filled, // แนะนำส่งแต่ที่กรอกจริง
      })

      // สมมุติ service คืน { id, ... } หรือ { status: 201, data: { id } }
      const newId = res?.id ?? res?.data?.id
      if (!newId) {
        setErrorMsg("ไม่สามารถสร้างร้านได้ (ไม่มีรหัสร้าน)")
        throw new Error("NO_STORE_ID")
      }

      setStoreId(newId);

      updateStepParam(currentStep + 1);
    } catch (e: any) {
      setErrorMsg(e?.message || "เกิดข้อผิดพลาดระหว่างสร้างร้าน");
    } finally {
      setSaving(false)
    }
  }, [
    storeName,
    members,
    storeType,
    MIN_MEMBERS,
    currentStep,
  ])

  const handleNext = useCallback(
    (step: number) => {
      setSaving(false)
      updateStepParam(step)
    },
    [updateStepParam]
  )

  const handleSimulatedSave = async (targetStep: number) => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    handleNext(targetStep)
  }

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
    key: "organizationName" | "presidentFirstName" | "presidentLastName" | "presidentStudentId",
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
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleProductFileChange = (id: string, file: File | null) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              file,
              fileName: file ? file.name : null,
            }
          : item
      )
    )
  }

  const handleAddProduct = () => {
    setProducts((prev) => [...prev, createProduct()])
  }

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)))
  }

  const handleSelectStoreType = (type: StoreType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("type", type)
    params.set("step", "1")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleFinalSubmit = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    console.log("Store draft submitted", {
      storeName,
      storeType,
      members,
      clubInfo: storeType === "Club" ? clubInfo : null,
      layoutDescription,
      layoutFile,
      products,
    })
    setSaving(false)
  }

  if (!storeType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl bg-white/80 p-10 text-center shadow-xl ring-1 ring-emerald-100">
          <h1 className="text-2xl font-semibold text-emerald-900">เลือกประเภทร้านค้าก่อนเริ่ม</h1>
          <p className="text-sm text-emerald-700">
            กรุณาเลือกว่าร้านค้าที่คุณกำลังสร้างเป็นร้านค้านิสิตหรือร้านค้าขององค์กรนิสิตเพื่อให้แบบฟอร์มแสดงข้อมูลที่ถูกต้อง
          </p>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button
              className="w-full justify-start gap-3 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => handleSelectStoreType("Nisit")}
            >
              ร้านค้านิสิต
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleSelectStoreType("Club")}
            >
              ร้านค้าองค์กรนิสิต
            </Button>
          </div>
          <Button
            variant="ghost"
            className="text-emerald-700 hover:bg-emerald-50"
            onClick={() => router.push("/home")}
          >
            กลับหน้าแรก
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">ลงทะเบียนสร้างร้าน</h1>
            <p className="mt-2 text-sm text-emerald-700">
              กรอกข้อมูลให้ครบทุกขั้นตอนเพื่อเตรียมเปิดร้านในงาน Kaset Fair 2026
            </p>
          </div>
          <StepIndicator steps={stepStatuses} />
        </header>

        {currentStep === 1 && (
          <>
            {errorMsg && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}
            <StepOneForm
              storeName={storeName}
              members={members}
              onStoreNameChange={setStoreName}
              onMemberChange={handleMemberChange}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onNext={handleCreateStore}
              saving={saving}
              />
            </>
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

