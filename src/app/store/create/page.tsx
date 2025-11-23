// page.tsx
"use client"

import { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StepSuccess } from "@/components/createStep/step-success"
import { useCreateStoreStep, useStoreWizardCore } from "@/hooks/store-wizard"

export default function StoreCreatePage() {
  const router = useRouter()
  const core = useStoreWizardCore()
  const createStep = useCreateStoreStep(core)

  const { storeType, storeStatus, storeAdminNisitId, isStoreAdmin, loadingStatus, stepError } = core

  // ร้านที่มี status แล้วแต่ยังไม่มี admin -> ถือว่ายังไม่ถูก claim ให้แก้ไขได้
  const isUnassignedStore = !!storeStatus && !storeStatus.storeAdminNisitId

  const canEditStore =
    !storeStatus || // ยังไม่มีร้านในระบบ
    isStoreAdmin || // เราเป็น admin ของร้านนี้
    isUnassignedStore // ร้านนี้ยังไม่มี admin

  const allowCreateSubmit =
    canEditStore &&
    (!storeStatus || (storeStatus.state !== "Pending" && storeStatus.state !== "Submitted"))
  const isPendingStore = storeStatus?.state === "Pending"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await createStep.submitCreateStore()
  }

  const handleViewOnlyNext = () => {
    router.push("/store/layout")
  }

  if (!storeType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl bg-white/80 p-10 text-center shadow-xl ring-1 ring-emerald-100">
          <h1 className="text-2xl font-semibold text-emerald-900">เลือกประเภทร้านค้าก่อนเริ่มลงทะเบียน</h1>
          {loadingStatus ? (
            <p className="text-sm text-emerald-700">กำลังโหลดสถานะการลงทะเบียนร้านล่าสุดของคุณ...</p>
          ) : (
            <>
              <p className="text-sm text-emerald-700">
                กรุณาเลือกประเภทร้านค้าเพื่อให้เราตั้งค่าขั้นตอนการลงทะเบียนให้เหมาะสม
              </p>
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <Button
                  className="w-full justify-start gap-3 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => createStep.selectStoreType("Nisit")}
                >
                  ร้านนิสิต
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => createStep.selectStoreType("Club")}
                >
                  ร้านหน่วยงาน / ชมรม
                </Button>
              </div>
              <Button
                variant="ghost"
                className="text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push("/home")}
              >
                กลับหน้าแรก
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (isPendingStore) {
    return (
      <StepSuccess
        isPendingStore
        storeStatus={storeStatus}
        pendingValidation={null}
        failedChecklistItems={[]}
        onReviewProducts={() => router.push("/store")}
        onGoHome={() => router.push("/home")}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          <CardHeader className="space-y-1 pb-0">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
                aria-label="ย้อนกลับ"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex-1 space-y-2">
                <CardTitle className="text-2xl font-bold tracking-tight text-emerald-900">
                  ลงทะเบียนร้านสำหรับงาน Kaset Fair
                </CardTitle>
                <CardDescription className="text-base text-emerald-700/80">
                  กรุณากรอกข้อมูลร้านและสมาชิกทีมด้านล่างให้ครบ คุณสามารถกลับมาแก้ไขได้ภายหลัง
                </CardDescription>
              </div>
            </div>

            {storeStatus?.storeAdminNisitId && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50/50 px-4 py-3 border border-emerald-100">
                <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-700 font-medium">
                  Store Admin
                </Badge>
                <span className="text-sm font-medium text-emerald-800">
                  {storeStatus.storeAdminNisitId}
                </span>
                {isStoreAdmin && (
                  <Badge variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700">
                    คุณเป็นแอดมินร้านนี้
                  </Badge>
                )}
              </div>
            )}

            {stepError && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-medium text-red-700">{stepError}</p>
              </div>
            )}
          </CardHeader>
        </Card>

        <Card className="border-emerald-100 bg-white/90 shadow-xl">
          <CardHeader className="-mb-2">
            <CardTitle className="text-emerald-800 text-xl font-bold">
              ข้อมูลร้านค้าและสมาชิกทีม
            </CardTitle>
            {!canEditStore && (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                คุณกำลังดูข้อมูลร้านในโหมดอ่านอย่างเดียว
                {" "}
                เฉพาะ Store Admin เท่านั้นที่สามารถแก้ไขข้อมูลได้
                {storeAdminNisitId ? (
                  <span className="ml-2 inline-flex items-center gap-2 text-xs text-amber-900">
                    <Badge variant="outline">Store Admin</Badge>
                    <span>{storeAdminNisitId}</span>
                  </span>
                ) : null}
              </div>
            )}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {stepError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
                  {stepError}
                </div>
              )}

              {/* STORE NAME */}
              <div className="space-y-2">
                <Label htmlFor="storeName" className="font-semibold text-[15px] text-emerald-900">
                  ชื่อร้านค้า
                </Label>
                <Input
                  id="storeName"
                  value={createStep.storeName}
                  onChange={(event) => createStep.setStoreName(event.target.value)}
                  placeholder="เช่น Kaset Fair Drinks"
                  required
                  disabled={!canEditStore}
                />
              </div>

              {/* MEMBERS */}
              <div className="space-y-3">
                <div>
                  <Label className="font-semibold text-[15px] text-emerald-900">
                    สมาชิกในร้าน (อีเมล KU Gmail)
                  </Label>
                  <p className="mt-1 text-sm text-emerald-700 leading-relaxed">
                    กรุณากรอกอีเมล KU Gmail (xxx@ku.th) ของสมาชิกในร้านอย่างน้อย 3 คน
                    ระบบจะใช้ข้อมูลนี้เพื่อเชิญเพื่อนร่วมทีม
                    <br />
                    คุณสามารถเพิ่มสมาชิกเพิ่มเติมได้มากกว่า 3 คนในภายหลัง
                  </p>
                </div>

                <div className="space-y-3">
                  {createStep.members.map((member, index) => {
                    const canRemove = createStep.members.length > 3 && index >= 3
                    const emailStatus = createStep.memberEmailStatuses.find(
                      (m) => m.email.trim().toLowerCase() === member.trim().toLowerCase()
                    )
                    const showWarning = emailStatus && emailStatus.status !== "Joined"

                    return (
                      <div key={`member-${index}`} className="space-y-1">
                        {showWarning && (
                          <p className="text-xs text-red-600 ml-1">
                            สถานะอีเมลนี้ในระบบ:
                            {" "}
                            <strong>{emailStatus.status}</strong>
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <Input
                            type="email"
                            placeholder={`อีเมลสมาชิกคนที่ ${index + 1}`}
                            value={member}
                            onChange={(event) => createStep.handleMemberChange(index, event.target.value)}
                            required={index < 3}
                            className={showWarning ? "border-red-400 focus-visible:ring-red-400" : ""}
                            disabled={!canEditStore}
                          />
                          {canRemove && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="border-red-200 text-red-500 hover:bg-red-50"
                              onClick={() => createStep.removeMember(index)}
                              disabled={!canEditStore}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={createStep.addMember}
                  disabled={!canEditStore}
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มอีเมลสมาชิก
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end mt-6">
              {canEditStore ? (
                <Button
                  type="submit"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={createStep.isSubmitting || !allowCreateSubmit}
                >
                  {createStep.isSubmitting ? "กำลังบันทึกข้อมูล..." : "บันทึกและไปขั้นตอนถัดไป"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleViewOnlyNext}
                >
                  ไปขั้นตอนถัดไป
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
