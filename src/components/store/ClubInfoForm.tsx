"use client"

import { FormEvent, useEffect, useId, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloud } from "lucide-react"

export type ClubInfoFormValues = {
  clubName: string
  leaderFirstName: string
  leaderLastName: string
  leaderNisitId: string
  leaderEmail: string
  leaderPhone: string
  clubApplicationMediaId: string | null
  applicationFileName: string | null
}

export type ClubInfoFormErrors = Partial<
  Record<keyof ClubInfoFormValues | "clubApplicationFile", string>
>

export type ClubInfoFormSubmitPayload = ClubInfoFormValues & {
  applicationFile: File | null
}

type ClubInfoFormProps = {
  initialValues?: Partial<ClubInfoFormValues>
  fieldErrors?: ClubInfoFormErrors
  submitting?: boolean
  generalError?: string | null
  onSubmit: (payload: ClubInfoFormSubmitPayload) => Promise<void> | void
  onCancel?: () => void
}

const emptyValues: ClubInfoFormValues = {
  clubName: "",
  leaderFirstName: "",
  leaderLastName: "",
  leaderNisitId: "",
  leaderEmail: "",
  leaderPhone: "",
  clubApplicationMediaId: null,
  applicationFileName: null,
}

export function ClubInfoForm({
  initialValues,
  fieldErrors,
  submitting = false,
  generalError = null,
  onSubmit,
  onCancel,
}: ClubInfoFormProps) {
  const fileInputId = useId()
  const [values, setValues] = useState<ClubInfoFormValues>(() => ({
    ...emptyValues,
    ...initialValues,
  }))
  const [applicationFile, setApplicationFile] = useState<File | null>(null)

  useEffect(() => {
    setValues({
      ...emptyValues,
      ...initialValues,
    })
    setApplicationFile(null)
  }, [initialValues])

  const isSubmitDisabled = useMemo(
    () =>
      submitting ||
      !values.clubName.trim() ||
      !values.leaderFirstName.trim() ||
      !values.leaderLastName.trim() ||
      !values.leaderNisitId.trim() ||
      !values.leaderEmail.trim() ||
      !values.leaderPhone.trim(),
    [submitting, values]
  )

  const handleChange = (key: keyof ClubInfoFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({
      ...values,
      applicationFile,
    })
  }

  const resolveError = (key: keyof ClubInfoFormValues | "clubApplicationFile") =>
    fieldErrors?.[key] ?? fieldErrors?.[`clubInfo.${key}` as keyof ClubInfoFormErrors] ?? null

  return (
    <Card className="border-emerald-100 bg-white/95 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-900">ข้อมูลองค์กรนิสิต</CardTitle>
        <p className="text-sm text-emerald-700">
          กรอกข้อมูลขององค์กรและประธานสโมสรให้ครบถ้วน จากนั้นแนบไฟล์คำขอรับรองล่าสุด
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <CardContent className="space-y-6">
          {generalError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="clubName">ชื่อองค์กรนิสิต</Label>
            <Input
              id="clubName"
              value={values.clubName}
              onChange={(event) => handleChange("clubName", event.target.value)}
              placeholder="ตัวอย่าง: สโมสรนิสิตคณะเกษตร"
              required
            />
            {resolveError("clubName") && (
              <p className="text-sm text-red-600">{resolveError("clubName")}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leaderFirstName">ชื่อประธาน</Label>
              <Input
                id="leaderFirstName"
                value={values.leaderFirstName}
                onChange={(event) => handleChange("leaderFirstName", event.target.value)}
                placeholder="ชื่อ"
                required
              />
              {resolveError("leaderFirstName") && (
                <p className="text-sm text-red-600">{resolveError("leaderFirstName")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaderLastName">นามสกุลประธาน</Label>
              <Input
                id="leaderLastName"
                value={values.leaderLastName}
                onChange={(event) => handleChange("leaderLastName", event.target.value)}
                placeholder="นามสกุล"
                required
              />
              {resolveError("leaderLastName") && (
                <p className="text-sm text-red-600">{resolveError("leaderLastName")}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leaderNisitId">รหัสนิสิตของประธาน</Label>
              <Input
                id="leaderNisitId"
                value={values.leaderNisitId}
                onChange={(event) => handleChange("leaderNisitId", event.target.value)}
                placeholder="65XXXXXXXX"
                inputMode="numeric"
                required
              />
              {resolveError("leaderNisitId") && (
                <p className="text-sm text-red-600">{resolveError("leaderNisitId")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaderEmail">อีเมลประธาน (KU Mail)</Label>
              <Input
                id="leaderEmail"
                type="email"
                value={values.leaderEmail}
                onChange={(event) => handleChange("leaderEmail", event.target.value)}
                placeholder="president@ku.th"
                required
              />
              {resolveError("leaderEmail") && (
                <p className="text-sm text-red-600">{resolveError("leaderEmail")}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaderPhone">เบอร์โทรศัพท์ประธาน</Label>
            <Input
              id="leaderPhone"
              value={values.leaderPhone}
              onChange={(event) => handleChange("leaderPhone", event.target.value)}
              placeholder="0812345678"
              inputMode="tel"
              required
            />
            {resolveError("leaderPhone") && (
              <p className="text-sm text-red-600">{resolveError("leaderPhone")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fileInputId}>ไฟล์คำขอรับรององค์กร (PDF / PNG / JPG)</Label>
            <label
              htmlFor={fileInputId}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-100"
            >
              <span className="truncate">
                {applicationFile?.name ?? values.applicationFileName ?? "เลือกไฟล์ ไม่เกิน 10 MB"}
              </span>
              <UploadCloud className="h-4 w-4" />
            </label>
            <Input
              id={fileInputId}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setApplicationFile(file)
                if (!file) return
                setValues((prev) => ({
                  ...prev,
                  applicationFileName: file.name,
                }))
              }}
            />
            <p className="text-xs text-emerald-600">
              ใช้ไฟล์ที่ลงนามเรียบร้อยแล้ว เพื่อให้ทีมตรวจสอบได้โดยรวดเร็ว
            </p>
            {resolveError("clubApplicationMediaId") && (
              <p className="text-sm text-red-600">{resolveError("clubApplicationMediaId")}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap justify-between gap-3 border-t border-emerald-100 bg-emerald-50/40 px-6 py-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={onCancel}
              disabled={submitting}
            >
              ย้อนกลับ
            </Button>
          )}
          <Button
            type="submit"
            className="min-w-[180px] bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={isSubmitDisabled}
          >
            {submitting ? "กำลังบันทึก..." : "บันทึกและไปขั้นถัดไป"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
