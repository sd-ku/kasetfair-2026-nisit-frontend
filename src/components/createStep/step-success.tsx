"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

type StepSuccessProps = {
  isPendingStore: boolean
  storeStatus: { state?: string } | null
  pendingValidation?: {
    state?: string
    isValid: boolean
  } | null
  failedChecklistItems: {
    key?: string
    label?: string
    message?: string | null
    description?: string | null
    isValid?: boolean
  }[]
  onReviewProducts: () => void
  onGoHome: () => void
}

export function StepSuccess({
  isPendingStore,
  storeStatus,
  pendingValidation,
  failedChecklistItems,
  onReviewProducts,
  onGoHome,
}: StepSuccessProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-100 bg-white/95 p-10 text-center shadow-2xl">
        {/* แสงประกายเบา ๆ */}
        <div className="pointer-events-none absolute -inset-1 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-200/30 via-teal-200/20 to-emerald-100/10 blur-2xl" />

        {/* ไอคอน */}
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle className="h-9 w-9" />
        </div>

        <h3 className="text-2xl font-semibold text-emerald-900">
          สร้างร้านสำเร็จแล้ว
        </h3>
        <p className="mt-2 text-sm text-emerald-700">
          ระบบบันทึกร้านของคุณและรอการจับฉลากเรียบร้อย
        </p>

        {/* <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200/70">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          {isPendingStore ? "กำลังรอตรวจสอบ" : (storeStatus?.state ?? "Submitted")}
        </div> */}

        {/* กล่องเช็กลิสต์ */}
        {/* <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-left">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-900">สถานะล่าสุด</p>
              <p className="text-xs text-emerald-700">
                สถานะร้าน: {pendingValidation?.state ?? storeStatus?.state ?? "กำลังประมวลผล"} •{" "}
                สรุปเช็กลิสต์:{" "}
                {pendingValidation
                  ? pendingValidation.isValid
                    ? "ผ่าน"
                    : "ต้องแก้ไข"
                  : "รอสรุปจากผู้ตรวจ"}
              </p>
            </div>
            <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
              In review queue
            </span>
          </div>

          {pendingValidation && failedChecklistItems.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {failedChecklistItems.map((item, index) => {
                const key = item.key || item.label || `item-${index}`
                const description = item.message || item.description || null
                return (
                  <li
                    key={key}
                    className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-white/70 p-3"
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        item.isValid ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-emerald-900">
                        {item.label || item.key || `Checklist item ${index + 1}`}
                      </p>
                      {description && <p className="text-xs text-emerald-700">{description}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {!pendingValidation && (
            <p className="mt-3 text-xs text-emerald-700">
              กำลังเตรียมสรุปการตรวจล่าสุด โปรดรอสักครู่
            </p>
          )}
        </div> */}

        {/* ปุ่มแอ็กชัน */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onGoHome}
          >
            กลับหน้าแรก
          </Button>
          <Button
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={onReviewProducts}
          >
            แก้ไขข้อมูลร้านค้า
          </Button>
        </div>
      </div>
    </div>
  )
}
