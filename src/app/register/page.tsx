"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createNisitInfo } from "@/services/nisitService"
import { uploadMedia } from "@/services/mediaService"
import { MediaPurpose } from "@/services/dto/media.dto"

// ⬇️ เพิ่ม dialog ของ shadcn
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter as DialogFooterUI,
} from "@/components/ui/dialog"
import { getConsentText } from "@/services/consentService"

type FormState = {
  firstName: string
  lastName: string
  nisitId: string
  phone: string
}

type FormErrors = {
  firstName?: string
  lastName?: string
  nisitId?: string
  phone?: string
  nisitCard?: string
}

type ConsentText = {
  id: string
  title: string
  consent: string
  language: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { status, data, update } = useSession()
  const params = useSearchParams() // ยังไม่ใช้ก็ช่างมันไว้ก่อน

  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    nisitId: "",
    phone: "",
  })

  const [nisitCardFile, setNisitCardFile] = useState<File | null>(null)
  const [nisitCardMediaId, setNisitCardMediaId] = useState<string | null>(null)

  const [uploadingCard, setUploadingCard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const hasRoutedRef = useRef(false)

  // ---------- consent modal state ----------
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const [consentText, setConsentText] = useState<ConsentText | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10)
      setFormData((prev) => ({ ...prev, phone: cleaned }))
      return
    }

    if (name === "nisitId") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10)
      setFormData((prev) => ({ ...prev, nisitId: cleaned }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      setNisitCardFile(null)
      setFieldErrors((prev) => ({
        ...prev,
        nisitCard: "กรุณาอัปโหลดรูปบัตรนิสิต",
      }))
      return
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]
    if (!allowed.includes(file.type)) {
      setNisitCardFile(null)
      setFieldErrors((prev) => ({
        ...prev,
        nisitCard: "ประเภทไฟล์ไม่รองรับ",
      }))
      e.target.value = ""
      return
    }

    setFieldErrors((prev) => ({ ...prev, nisitCard: undefined }))
    setNisitCardFile(file)
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.firstName.trim()) {
      errors.firstName = "กรุณากรอกชื่อ"
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "กรุณากรอกนามสกุล"
    }

    if (!formData.nisitId.trim()) {
      errors.nisitId = "กรุณากรอกรหัสนิสิต"
    } else if (formData.nisitId.length !== 10) {
      errors.nisitId = "รหัสนิสิตต้องมี 10 หลัก"
    }

    const phoneOk = /^0[0-9]{9}$/.test(formData.phone)
    if (!formData.phone.trim()) {
      errors.phone = "กรุณากรอกเบอร์โทร"
    } else if (!phoneOk) {
      errors.phone = "เบอร์โทรต้องมี 10 หลัก และขึ้นต้นด้วย 0"
    }

    if (!nisitCardFile) {
      errors.nisitCard = "กรุณาอัปโหลดรูปบัตรนิสิต"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // โหลดข้อความ consent ปัจจุบัน (แก้ endpoint ให้ตรง backend นายเอง)
  const loadActiveConsent = async () => {
    if (consentText) return // โหลดแล้วไม่ต้องโหลดซ้ำ
    setConsentLoading(true)
    setConsentError(null)
    try {
      const data = await getConsentText()
      if (!data) {
        throw new Error("ไม่สามารถโหลดข้อความยินยอมได้")
      }
      setConsentText({
        id: data.id,
        title: data.title,
        consent: data.consent,
        language: data.language,
      })
    } catch (err: any) {
      console.error("Load consent failed:", err)
      setConsentError(
        err?.message || "โหลดข้อความยินยอมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      )
    } finally {
      setConsentLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || uploadingCard) return

    setApiError(null)

    if (!validateForm()) return
    if (!nisitCardFile) return

    // แทนที่จะ register เลย → เปิด consent dialog ก่อน
    setConsentChecked(false)
    setConsentError(null)
    setShowConsentDialog(true)
    void loadActiveConsent()
  }

  // ฟังก์ชันที่ทำงานจริงหลังจาก user กดยินยอมใน modal แล้ว
  const performRegistrationWithConsent = async () => {
    if (!nisitCardFile) return // กัน edge case
    if (!consentText) {
      setConsentError("ไม่พบข้อความยินยอมที่ต้องใช้ กรุณารีเฟรชหน้าแล้วลองใหม่")
      return
    }

    setSubmitting(true)
    setIsLoading(true)
    setUploadingCard(true)
    setApiError(null)

    try {
      // 1) อัปโหลดไฟล์บัตรนิสิต
      const uploadRes = await uploadMedia({
        purpose: MediaPurpose.NISIT_CARD,
        file: nisitCardFile,
      })
      if (!uploadRes.id) throw new Error("อัปโหลดภาพไม่สำเร็จ")

      const mediaId = uploadRes.id
      setNisitCardMediaId(mediaId)

      // 2) ยิงสร้าง profile พร้อม mediaId + consent
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nisitId: formData.nisitId.trim(),
        phone: formData.phone.trim(),
        nisitCardMediaId: mediaId,
        consentTextId: consentText.id,
        consentAccepted: true,
      }

      const res = await createNisitInfo(payload)
      if (!res) throw new Error("Registration did not complete")

      await update?.({ profileComplete: true } as any)
      router.replace("/home")
    } catch (err: any) {
      console.error("Registration failed:", err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again."
      setApiError(msg)
    } finally {
      setUploadingCard(false)
      setIsLoading(false)
      setSubmitting(false)
    }
  }

  const handleConfirmConsent = async () => {
    if (!consentChecked) {
      setConsentError("กรุณาติ๊กยืนยันว่าคุณได้อ่านและยอมรับเงื่อนไขแล้ว")
      return
    }
    setConsentError(null)
    setShowConsentDialog(false)
    await performRegistrationWithConsent()
  }

  useEffect(() => {
    if (status !== "authenticated") return

    const profileComplete = (data as any)?.profileComplete

    if (profileComplete && !hasRoutedRef.current) {
      hasRoutedRef.current = true
      router.replace("/home")
    }
  }, [status, data, router])

  if (status === "loading") {
    return (
      <p className="text-center mt-10 text-gray-600">
        กำลังตรวจสอบสิทธิ์…
      </p>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">
              Create Account
            </h1>
            <p className="text-emerald-600">Join the Kaset Fair</p>
          </div>

          <Card className="border-emerald-200 shadow-lg">
            <form
              className="flex flex-col gap-6"
              onSubmit={handleRegister}
              noValidate
            >
              <CardContent className="space-y-4">
                <Field
                  id="firstName"
                  name="firstName"
                  label="ชื่อ"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading || uploadingCard}
                  autoComplete="given-name"
                  error={fieldErrors.firstName}
                  required
                />

                <Field
                  id="lastName"
                  name="lastName"
                  label="นามสกุล"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading || uploadingCard}
                  autoComplete="family-name"
                  error={fieldErrors.lastName}
                  required
                />

                <Field
                  id="nisitId"
                  name="nisitId"
                  label="รหัสนิสิต"
                  value={formData.nisitId}
                  onChange={handleInputChange}
                  disabled={isLoading || uploadingCard}
                  autoComplete="student-id"
                  error={fieldErrors.nisitId}
                  required
                />

                <Field
                  id="phone"
                  name="phone"
                  label="เบอร์โทร"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isLoading || uploadingCard}
                  type="tel"
                  inputMode="numeric"
                  placeholder="08xxxxxxxx"
                  error={fieldErrors.phone}
                  required
                />

                <div className="space-y-2">
                  <Label
                    htmlFor="nisitCard"
                    className={fieldErrors.nisitCard ? "text-red-600" : ""}
                  >
                    อัปโหลดรูปบัตรนิสิต
                  </Label>
                  <Input
                    id="nisitCard"
                    name="nisitCard"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={isLoading || uploadingCard}
                    onChange={handleFileChange}
                    className={fieldErrors.nisitCard ? "border-red-500" : ""}
                    required
                  />
                  {uploadingCard && (
                    <p className="text-xs text-emerald-600">
                      กำลังอัปโหลดรูปบัตรนิสิต…
                    </p>
                  )}
                  {nisitCardFile && !uploadingCard && (
                    <p className="text-xs text-emerald-700">
                      ใช้ไฟล์: {nisitCardFile.name}
                    </p>
                  )}
                  {fieldErrors.nisitCard && (
                    <p className="text-xs text-red-600">
                      {fieldErrors.nisitCard}
                    </p>
                  )}
                </div>

                {apiError && (
                  <p
                    role="alert"
                    className="text-sm text-red-600 p-3 bg-red-50 rounded-md"
                  >
                    {apiError}
                  </p>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400"
                  disabled={isLoading || uploadingCard || submitting}
                >
                  {uploadingCard
                    ? "กำลังอัปโหลดรูป..."
                    : submitting
                    ? "กำลังสร้างบัญชี..."
                    : "Create account"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* ---------- Consent Dialog ---------- */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {consentText?.title || "ข้อตกลงในการเก็บและใช้ข้อมูลส่วนบุคคล"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
                {consentLoading
                  ? "กำลังโหลดข้อความยินยอม..."
                  : consentText?.consent ||
                    "ไม่สามารถโหลดข้อความยินยอมได้ กรุณาลองใหม่อีกครั้ง"}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-start gap-2">
            <input
              id="consentCheckbox"
              type="checkbox"
              className="mt-1"
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked)
                if (consentError) setConsentError(null)
              }}
              disabled={consentLoading}
            />
            <Label htmlFor="consentCheckbox" className="text-sm text-gray-800">
              ข้าพเจ้าได้อ่านและเข้าใจข้อความข้างต้น และยินยอมให้มีการเก็บและใช้ข้อมูลส่วนบุคคลตามที่ระบุไว้
            </Label>
          </div>

          {consentError && (
            <p className="mt-2 text-xs text-red-600">{consentError}</p>
          )}

          <DialogFooterUI className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowConsentDialog(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleConfirmConsent}
              disabled={consentLoading || submitting}
            >
              {submitting ? "กำลังสร้างบัญชี..." : "ยืนยันและสร้างบัญชี"}
            </Button>
          </DialogFooterUI>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field(props: {
  id: string
  name: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  placeholder?: string
  autoComplete?: string
  error?: string
}) {
  const {
    id,
    name,
    label,
    value,
    onChange,
    disabled,
    required,
    type = "text",
    inputMode,
    placeholder,
    autoComplete,
    error,
  } = props

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={error ? "text-red-600" : ""}>
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
