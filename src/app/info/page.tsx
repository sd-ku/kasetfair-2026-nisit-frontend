"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { getNisitInfo, updateNisitInfo } from "@/services/nisitService"
import type { NisitInfo } from "@/services/dto/nisit-info.dto"
import { GoogleFileUpload } from "@/components/uploadFile"
import { getMediaUrl, uploadMediaViaPresign } from "@/services/mediaService"
import { MediaPurpose } from "@/services/dto/media.dto"
import { extractErrorMessage } from "@/services/utils/extractErrorMsg"

type FormState = {
  firstName: string
  lastName: string
  nisitId: string
  phone: string
  email: string
  nisitCardMediaId: string
}

type InitialUploadedFile = {
  id: string
  name: string
  url: string
  size?: number
  type?: string
}

export default function EditNisitPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    nisitId: "",
    phone: "",
    email: "",
    nisitCardMediaId: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // ลบ error/success state แบบเก่าออก เพื่อใช้ toast แทน หรือเก็บ error ไว้เฉพาะตอนโหลดหน้าแรกไม่ผ่าน
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [initialCardUploadedFiles, setInitialCardUploadedFiles] = useState<InitialUploadedFile[]>([])

  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    const bootstrap = async () => {
      setLoading(true)
      setFetchError(null)
      try {
        const result = (await getNisitInfo()) as NisitInfo | undefined
        if (!result) {
          setFetchError("ไม่สามารถโหลดข้อมูลนิสิตได้ กรุณาลองใหม่อีกครั้ง")
          // Toast แจ้งเตือนเมื่อโหลดข้อมูลไม่สำเร็จ
          toast({
            variant: "destructive",
            title: "ผิดพลาด",
            description: "ไม่สามารถโหลดข้อมูลนิสิตได้",
          })
          return
        }
        setFormData({
          firstName: result.firstName ?? "",
          lastName: result.lastName ?? "",
          nisitId: result.nisitId ?? "",
          phone: result.phone ?? "",
          email: result.email ?? "",
          nisitCardMediaId: result.nisitCardMediaId ?? "",
        })
        if (result.nisitCardMediaId) {
          const mediaRes = await getMediaUrl(result.nisitCardMediaId)
          setInitialCardUploadedFiles([
            {
              id: result.nisitCardMediaId,
              name: mediaRes.originalName ?? "card_name",
              url: mediaRes.link ?? "",
              size: mediaRes.size,
              type: mediaRes.mimeType,
            },
          ])
        }

      } catch (err) {
        console.error(err)
        setFetchError("เกิดข้อผิดพลาดระหว่างโหลดข้อมูล กรุณาลองใหม่")
        toast({
          variant: "destructive",
          title: "ผิดพลาด",
          description: "เกิดข้อผิดพลาดระหว่างโหลดข้อมูล",
        })
      } finally {
        setLoading(false)
      }
    }
    void bootstrap()
  }, [toast]) // เพิ่ม dependency

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10)
      setFormData((prev) => ({ ...prev, phone: cleaned }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    // Validation Check
    const phoneOk = /^0[0-9]{9}$/.test(formData.phone)
    if (!phoneOk) {
      toast({
        variant: "destructive",
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณากรอกเบอร์โทรให้ถูกต้อง (10 หลักขึ้นต้นด้วย 0)",
      })
      return
    }

    setSaving(true)

    try {
      let nisitCardMediaId = formData.nisitCardMediaId

      if (uploadedFiles.length > 0) {
        const uploadRes = await uploadMediaViaPresign({
          purpose: MediaPurpose.NISIT_CARD,
          file: uploadedFiles[0],
        })

        if (!uploadRes?.mediaId) {
          throw new Error("Upload failed")
        }

        nisitCardMediaId = uploadRes.mediaId
        setFormData((prev) => ({ ...prev, nisitCardMediaId }))
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        ...(nisitCardMediaId ? { nisitCardMediaId } : {}),
      }

      const result = await updateNisitInfo(payload)
      if (!result) {
        toast({
          variant: "destructive",
          title: "บันทึกไม่สำเร็จ",
          description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่",
        })
        return
      }

      // Success Toast
      toast({
        variant: "success", // ใช้ variant success ตามที่ร้องขอ
        title: "บันทึกสำเร็จ",
        description: "ข้อมูลของคุณถูกอัปเดตเรียบร้อยแล้ว",
      })

    } catch (err) {
      console.error(err)
      const msg = extractErrorMessage(err, "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล กรุณาลองใหม่")
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: msg,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <p className="text-emerald-700">กำลังโหลดข้อมูลนิสิต...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">แก้ไขข้อมูลนิสิต</h1>
          <p className="text-emerald-600">ปรับปรุงข้อมูลส่วนตัวให้ถูกต้อง</p>
        </div>

        <Card className="border-emerald-200 shadow-lg">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              <Field
                id="firstName"
                name="firstName"
                label="ชื่อ"
                value={formData.firstName}
                onChange={handleChange}
                disabled
              />

              <Field
                id="lastName"
                name="lastName"
                label="นามสกุล"
                value={formData.lastName}
                onChange={handleChange}
                disabled
              />

              <Field
                id="nisitId"
                name="nisitId"
                label="รหัสนิสิต"
                value={formData.nisitId}
                disabled
              />

              <Field
                id="email"
                name="email"
                label="อีเมล"
                value={formData.email}
                onChange={handleChange}
                type="email"
                pattern="^[a-zA-Z0-9._%+-]+@ku\.th$"
                placeholder="your.email@ku.th"
                disabled
              />

              <Field
                id="phone"
                name="phone"
                label="เบอร์โทรศัพท์"
                value={formData.phone}
                onChange={handleChange}
                disabled={saving}
                type="tel"
                inputMode="numeric"
                pattern="^0[0-9]{9}$"
                placeholder="08xxxxxxxx"
                required
              />


              <div className="space-y-2">
                <Label htmlFor="nisitCard">บัตรนิสิต</Label>
                <GoogleFileUpload
                  maxFiles={1}
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  onFilesChange={handleFilesChange}
                  disabled={saving}
                  initialFiles={initialCardUploadedFiles}
                />
              </div>

              {/* แสดง Error เฉพาะกรณี Load หน้าเว็บไม่ขึ้น (Critical Error) */}
              {fetchError && (
                <p role="alert" className="text-sm text-red-600">
                  {fetchError}
                </p>
              )}
            </CardContent>

            <CardFooter className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                onClick={handleBack}
                disabled={saving}
              >
                ย้อนกลับ
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400"
                disabled={saving}
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

type FieldProps = {
  id: string
  name: string
  label: string
  value: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  pattern?: string
  placeholder?: string
  autoComplete?: string
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
  required,
  type = "text",
  inputMode,
  pattern,
  placeholder,
  autoComplete,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  )
}