"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloud } from "lucide-react"
import Image from "next/image"

type StepTwoFormProps = {
  layoutDescription: string
  layoutFileName: string | null
  isStoreAdmin: boolean
  storeAdminNisitId?: string | null
  onDescriptionChange: (value: string) => void
  onFileChange: (file: File | null) => void
  onBack: () => void
  onNext: () => void
  saving: boolean
}

export function StepTwoForm({
  layoutDescription,
  layoutFileName,
  isStoreAdmin,
  storeAdminNisitId,
  onDescriptionChange,
  onFileChange,
  onBack,
  onNext,
  saving,
}: StepTwoFormProps) {
  void layoutDescription
  void onDescriptionChange

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onNext()
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-emerald-800">
          ผังร้านและตำแหน่งบูธ
          {/* <span className="block text-xs font-medium text-emerald-600 mt-1">
            ใช้สำหรับกำหนดรูปแบบพื้นที่และการจัดวางบูธในงานจริง
          </span> */}
        </CardTitle>
        {!isStoreAdmin && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            คุณสามารถดูข้อมูลนี้ได้ แต่มีเพียงผู้ดูแลร้านเท่านั้นที่สามารถแก้ไขได้
            {storeAdminNisitId ? (
              <span className="ml-2 text-xs text-amber-900">
                ผู้ดูแลร้าน: {storeAdminNisitId}
              </span>
            ) : null}
          </div>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            {/* ใช้ p แทน Label เพราะไม่มี input ผูกอยู่ตรง ๆ */}
            <p className="text-sm font-medium text-emerald-900">
              ตัวอย่างผังร้าน (ใช้เป็นแนวทางในการจัดทำผังของคุณ)
            </p>
            <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 shadow-inner">
              <Image
                src="/layoutStore.png"
                alt="layout store reference"
                width={531}
                height={564}
                sizes="(min-width: 768px) 531px, 100vw"
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="layoutFile">อัปโหลดผังร้านของคุณ</Label>
            <label
              htmlFor="layoutFile"
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-100"
              aria-disabled={!isStoreAdmin}
            >
              <span>{layoutFileName ?? "เลือกไฟล์ .pdf หรือ .png"}</span>
              <UploadCloud className="h-4 w-4" />
            </label>
            <Input
              id="layoutFile"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              className="hidden"
              disabled={!isStoreAdmin}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                onFileChange(file)
              }}
            />
            <p id="layoutFileHelp" className="text-xs text-emerald-600">
              รองรับไฟล์ .png, .jpg, .jpeg และ .pdf ขนาดไม่เกิน 10 MB
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between pt-6">
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
            disabled={saving || !isStoreAdmin}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกผังร้าน"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
