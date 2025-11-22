"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createNisitInfo } from "@/services/nisitService"
import { GoogleFileUpload } from "@/components/uploadFile"
import { getMediaUrl, uploadMediaViaPresign } from "@/services/mediaService"
import { MediaPurpose } from "@/services/dto/media.dto"
import { getNisitInfo } from "@/services/nisitService"
import { getDormitories, type Dormitory } from "@/services/dormitoryService"

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
  dormitoryTypeId: number | null
}

type FormErrors = {
  firstName?: string
  lastName?: string
  nisitId?: string
  phone?: string
  nisitCard?: string
  dormitoryTypeId?: string
}

type ConsentText = {
  id: string
  title: string
  consent: string
  language: string
}

type InitialUploadedFile = {
  id: string
  name: string
  url: string
  size?: number
  type?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { status, data, update } = useSession()

  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    nisitId: "",
    phone: "",
    dormitoryTypeId: null,
  })

  const [dormitories, setDormitories] = useState<Dormitory[]>([])
  const [loadingDormitories, setLoadingDormitories] = useState(false)

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [initialCardUploadedFiles, setInitialCardUploadedFiles] = useState<InitialUploadedFile[]>([])
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

  const [locked, setLocked] = useState({
    firstName: false,
    lastName: false,
    nisitId: false,
    phone: false,
    nisitCard: false, // true = ไม่ให้เปลี่ยนไฟล์
    dormitoryTypeId: false,
  })

  // Fetch dormitories on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingDormitories(true)
      try {
        const data = await getDormitories()
        if (!cancelled) {
          // Sort by order, then filter active ones
          const sorted = data
            .filter((d) => d.isActive)
            .sort((a, b) => a.order - b.order)
          setDormitories(sorted)
        }
      } catch (err) {
        console.error("Failed to load dormitories:", err)
      } finally {
        if (!cancelled) {
          setLoadingDormitories(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // if (status !== "authenticated") return

    let cancelled = false
    ;(async () => {
      try {
        // 1) ดึงจาก API เป็นหลัก
        const existing = await getNisitInfo().catch(() => null)

        // 2) fallback จาก session payload (กรณี backend เคยยัดมาให้ใน token)
        const tokenAny = (data as any) ?? {}
        const fromToken = {
          firstName: tokenAny.firstName ?? null,
          lastName: tokenAny.lastName ?? null,
          nisitId: tokenAny.nisitId ?? null,
          phone: tokenAny.phone ?? null,
        }

        // merge priority: API > token > current state
        const merged = {
          firstName: existing?.firstName ?? fromToken.firstName ?? formData.firstName,
          lastName:  existing?.lastName  ?? fromToken.lastName  ?? formData.lastName,
          nisitId:   existing?.nisitId   ?? fromToken.nisitId   ?? formData.nisitId,
          phone:     existing?.phone     ?? fromToken.phone     ?? formData.phone,
          dormitoryTypeId: existing?.dormitoryTypeId ?? formData.dormitoryTypeId,
        }

        const mediaId = existing?.nisitCardMediaId ?? null
        let initialFiles: InitialUploadedFile[] = []

        if (mediaId) {
          try {
            const mediaRes = await getMediaUrl(mediaId)
            initialFiles = [
              {
                id: mediaId,
                name: mediaRes.originalName ?? "card_name",
                url: mediaRes.link ?? "",
                size: mediaRes.size,
                type: mediaRes.mimeType,
              },
            ]
          } catch (err) {
            console.error(err)
          }
        }

        if (!cancelled) {
          setFormData(merged)
          setNisitCardMediaId(mediaId)
          setInitialCardUploadedFiles(initialFiles)

          setLocked({
            firstName: !!merged.firstName,
            lastName:  !!merged.lastName,
            nisitId:   !!merged.nisitId,
            phone:     !!merged.phone,
            nisitCard: !!mediaId, // ถ้ามีไฟล์แล้ว → ล็อกอัปโหลด
            dormitoryTypeId: !!merged.dormitoryTypeId,
          })
        }
      } catch {
        // เงียบ ๆ ไป ไม่บล็อกการลงทะเบียนใหม่
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status, data]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (locked[name as keyof typeof locked]) return

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

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
    if (files.length > 0 && fieldErrors.nisitCard) {
      setFieldErrors((prev) => ({ ...prev, nisitCard: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    const need = (key: keyof FormState) =>
      !(locked[key] && formData[key]) // ถ้าล็อกและมีค่าแล้ว → ไม่ต้องเช็ค

    if (need("firstName") && !formData.firstName.trim()) {
      errors.firstName = "กรุณากรอกชื่อ"
    }

    if (need("lastName") && !formData.lastName.trim()) {
      errors.lastName = "กรุณากรอกนามสกุล"
    }

    if (need("nisitId")) {
      if (!formData.nisitId.trim()) {
        errors.nisitId = "กรุณากรอกรหัสนิสิต"
      } else if (formData.nisitId.length !== 10) {
        errors.nisitId = "รหัสนิสิตต้องมี 10 หลัก"
      }
    }

    if (need("phone")) {
      const phoneOk = /^0[0-9]{9}$/.test(formData.phone)
      if (!formData.phone.trim()) {
        errors.phone = "กรุณากรอกเบอร์โทร"
      } else if (!phoneOk) {
        errors.phone = "เบอร์โทรต้องมี 10 หลัก และขึ้นต้นด้วย 0"
      }
    }

    if (!locked.nisitCard && uploadedFiles.length === 0) {
      errors.nisitCard = "กรุณาอัปโหลดรูปบัตรนิสิต"
    }

    if (!locked.dormitoryTypeId && (formData.dormitoryTypeId === null || formData.dormitoryTypeId === undefined)) {
      errors.dormitoryTypeId = "กรุณาเลือกประเภทหอพัก"
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
    if (!locked.nisitCard && uploadedFiles.length === 0) return

    // แทนที่จะ register เลย → เปิด consent dialog ก่อน
    setConsentChecked(false)
    setConsentError(null)
    setShowConsentDialog(true)
    void loadActiveConsent()
  }

  // ฟังก์ชันที่ทำงานจริงหลังจาก user กดยินยอมใน modal แล้ว
  const performRegistrationWithConsent = async () => {
    if (!consentText) {
      setConsentError("ไม่พบข้อความยินยอมที่ต้องใช้ กรุณารีเฟรชหน้าแล้วลองใหม่")
      return
    }

    const fileToUpload = uploadedFiles[0]

    setSubmitting(true)
    setIsLoading(true)
    setUploadingCard(true)
    setApiError(null)

    try {
      let mediaId = nisitCardMediaId

      if (!locked.nisitCard) {
        if (!fileToUpload) {
          throw new Error("กรุณาอัปโหลดรูปบัตรนิสิต")
        }

        const uploadRes = await uploadMediaViaPresign({
          purpose: MediaPurpose.NISIT_CARD,
          file: fileToUpload,
        })
        if (!uploadRes?.mediaId) throw new Error("อัปโหลดภาพไม่สำเร็จ")

        mediaId = uploadRes.mediaId
        setNisitCardMediaId(mediaId)
      }

      if (!mediaId) throw new Error("กรุณาอัปโหลดรูปบัตรนิสิต")

      // 2) ยิงสร้าง profile พร้อม mediaId + consent
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nisitId: formData.nisitId.trim(),
        phone: formData.phone.trim(),
        dormitoryTypeId: formData.dormitoryTypeId!,
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
                  readOnly={locked.firstName}
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
                  readOnly={locked.lastName}
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
                  readOnly={locked.nisitId}
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
                  readOnly={locked.phone}
                  type="tel"
                  inputMode="numeric"
                  placeholder="08xxxxxxxx"
                  error={fieldErrors.phone}
                  required
                />

                <div className="space-y-2">
                  <Label
                    htmlFor="dormitoryTypeId"
                    className={fieldErrors.dormitoryTypeId ? "text-red-600" : ""}
                  >
                    ประเภทหอพัก <span className="text-red-500">*</span>
                  </Label>
                  {loadingDormitories ? (
                    <p className="text-sm text-gray-500">กำลังโหลดข้อมูลหอพัก...</p>
                  ) : (
                    <div className="space-y-2">
                      {dormitories.map((dormitory) => (
                        <div key={dormitory.id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`dormitory-${dormitory.id}`}
                            name="dormitoryTypeId"
                            value={dormitory.id}
                            checked={formData.dormitoryTypeId === dormitory.id}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10)
                              setFormData((prev) => ({ ...prev, dormitoryTypeId: value }))
                              if (fieldErrors.dormitoryTypeId) {
                                setFieldErrors((prev) => ({ ...prev, dormitoryTypeId: undefined }))
                              }
                            }}
                            disabled={isLoading || uploadingCard || locked.dormitoryTypeId}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <Label
                            htmlFor={`dormitory-${dormitory.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {dormitory.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  {fieldErrors.dormitoryTypeId && (
                    <p className="text-xs text-red-600">{fieldErrors.dormitoryTypeId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="nisitCard"
                    className={fieldErrors.nisitCard ? "text-red-600" : ""}
                  >
                    Upload student card
                  </Label>

                  <GoogleFileUpload
                    maxFiles={1}
                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                    maxSize={5 * 1024 * 1024}
                    onFilesChange={handleFilesChange}
                    disabled={isLoading || uploadingCard || locked.nisitCard}
                    initialFiles={initialCardUploadedFiles}
                  />
                  {fieldErrors.nisitCard && (
                    <p className="text-xs text-red-600">{fieldErrors.nisitCard}</p>
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
  readOnly?: boolean
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
    readOnly,
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
        readOnly={readOnly}
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
