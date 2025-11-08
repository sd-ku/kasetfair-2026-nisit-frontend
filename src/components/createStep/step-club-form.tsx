"use client"

import { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloud } from "lucide-react"

type StepClubInfoFormProps = {
  organizationName: string
  presidentFirstName: string
  presidentLastName: string
  presidentNisitId: string
  presidentEmail: string
  presidentPhone: string
  applicationFileName: string | null
  onOrganizationNameChange: (value: string) => void
  onPresidentFirstNameChange: (value: string) => void
  onPresidentLastNameChange: (value: string) => void
  onpresidentNisitIdChange: (value: string) => void
  onPresidentEmailChange: (value: string) => void
  onPresidentPhoneChange: (value: string) => void
  onApplicationFileChange: (file: File | null) => void
  onBack: () => void
  onNext: () => void
  saving: boolean
}

export function StepClubInfoForm({
  organizationName,
  presidentFirstName,
  presidentLastName,
  presidentNisitId,
  presidentEmail,
  presidentPhone,
  applicationFileName,
  onOrganizationNameChange,
  onPresidentFirstNameChange,
  onPresidentLastNameChange,
  onpresidentNisitIdChange,
  onPresidentEmailChange,
  onPresidentPhoneChange,
  onApplicationFileChange,
  onBack,
  onNext,
  saving,
}: StepClubInfoFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onNext()
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-800">ข้อมูลองค์กรนิสิต</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="organizationName">ชื่อองค์กรนิสิต</Label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(event) => onOrganizationNameChange(event.target.value)}
              placeholder="เช่น ชมรมดนตรี"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="presidentFirstName">ชื่อ (ประธานชมรม)</Label>
              <Input
                id="presidentFirstName"
                value={presidentFirstName}
                onChange={(event) => onPresidentFirstNameChange(event.target.value)}
                placeholder="สมชาย"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presidentLastName">นามสกุล (ประธานชมรม)</Label>
              <Input
                id="presidentLastName"
                value={presidentLastName}
                onChange={(event) => onPresidentLastNameChange(event.target.value)}
                placeholder="ใจดี"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="presidentNisitId">รหัสนิสิต (ประธานชมรม)</Label>
              <Input
                id="presidentNisitId"
                value={presidentNisitId}
                onChange={(event) => onpresidentNisitIdChange(event.target.value)}
                placeholder="6501234567"
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presidentEmail">อีเมล (ประธานชมรม)</Label>
              <Input
                id="presidentEmail"
                type="email"
                value={presidentEmail}
                onChange={(event) => onPresidentEmailChange(event.target.value)}
                placeholder="example@ku.th"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presidentPhone">เบอร์โทรศัพท์ (ประธานชมรม)</Label>
            <Input
              id="presidentPhone"
              type="tel"
              value={presidentPhone}
              onChange={(event) => onPresidentPhoneChange(event.target.value)}
              placeholder="0812345678"
              inputMode="tel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clubApplicationFile">ใบสมัครร้านค้าขององค์กรนิสิต</Label>
            <label
              htmlFor="clubApplicationFile"
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-100"
            >
              <span className="truncate">
                {applicationFileName ?? "แนบไฟล์ .pdf หรือ .png ไม่เกิน 10 MB"}
              </span>
              <UploadCloud className="h-4 w-4" />
            </label>
            <Input
              id="clubApplicationFile"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(event) => onApplicationFileChange(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-emerald-600">
              ใช้ไฟล์ใบสมัครหรือเอกสารที่ยืนยันสิทธิ์การเปิดร้านขององค์กรนิสิต
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={onBack}
          >
            ย้อนกลับ
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={saving}
          >
            {saving ? "กำลังบันทึก..." : "ต่อไป"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
