"use client"

import { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { MemberEmailsDraftDto } from "@/services/dto/store-draft.dto"

type StepOneFormProps = {
  storeName: string
  members: string[]
  memberEmailStatuses: MemberEmailsDraftDto[]
  isStoreAdmin: boolean
  storeAdminNisitId?: string | null
  onStoreNameChange: (value: string) => void
  onMemberChange: (index: number, value: string) => void
  onAddMember: () => void
  onRemoveMember: (index: number) => void
  onNext: () => Promise<void> | void
  onViewOnlyNext?: () => void
  saving: boolean
  canSubmit?: boolean
  errorMessage?: string | null
}

export function StepOneForm({
  storeName,
  members,
  memberEmailStatuses,
  isStoreAdmin,
  storeAdminNisitId,
  onStoreNameChange,
  onMemberChange,
  onAddMember,
  onRemoveMember,
  onNext,
  onViewOnlyNext,
  saving,
  canSubmit = true,
  errorMessage = null,
}: StepOneFormProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onNext()
  }

  const submitDisabled = saving || !canSubmit || !isStoreAdmin

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader className="-mb-2">
        <CardTitle className="text-emerald-800 text-xl font-bold">
          สร้างร้านค้า
        </CardTitle>
        {!isStoreAdmin && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            คุณสามารถดูข้อมูลนี้ได้ แต่มีเพียงผู้ดูแลร้านเท่านั้นที่สามารถแก้ไขได้
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
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
              {errorMessage}
            </div>
          )}

          {/* STORE NAME */}
          <div className="space-y-2">
            <Label htmlFor="storeName" className="font-semibold text-[15px] text-emerald-900">
              ชื่อร้านค้า
            </Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(event) => onStoreNameChange(event.target.value)}
              placeholder="ตัวอย่าง Kaset Fair Drinks"
              required
              disabled={!isStoreAdmin}
            />
          </div>

          {/* MEMBERS */}
          <div className="space-y-3">
            <div>
              <Label className="font-semibold text-[15px] text-emerald-900">
                สมาชิกภายในร้าน
              </Label>
              <p className="mt-1 text-sm text-emerald-700 leading-relaxed">
                เพิ่มสมาชิกอย่างน้อย 3 คน โดยใช้อีเมล KU Gmail (xxx@ku.th)
                <br />สามารถเพิ่มได้ภายหลัง
              </p>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => {
                const canRemove = members.length > 3 && index >= 3
                const emailStatus = memberEmailStatuses.find(
                  (m) => m.email.trim().toLowerCase() === member.trim().toLowerCase()
                )
                const showWarning = emailStatus && emailStatus.status !== "Joined"

                return (
                  <div key={`member-${index}`} className="space-y-1">
                    {showWarning && (
                      <p className="text-xs text-red-600 ml-1">
                        สถานะผู้ใช้: <strong>{emailStatus.status}</strong>
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <Input
                        type="email"
                        placeholder={`อีเมลสมาชิกที่ ${index + 1}`}
                        value={member}
                        onChange={(event) => onMemberChange(index, event.target.value)}
                        required={index < 3}
                        className={
                          showWarning
                            ? "border-red-400 focus-visible:ring-red-400"
                            : ""
                        }
                        disabled={!isStoreAdmin}
                      />
                      {canRemove && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => onRemoveMember(index)}
                          disabled={!isStoreAdmin}
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
              onClick={onAddMember}
              disabled={!isStoreAdmin}
            >
              <Plus className="h-4 w-4" />
              เพิ่มสมาชิก
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end mt-6">
          {isStoreAdmin ? (
            <Button
              type="submit"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={submitDisabled}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกและไปขั้นถัดไป"}
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => onViewOnlyNext?.()}
            >
              ถัดไป
            </Button>
          )}
        </CardFooter>

      </form>
    </Card>
  )
}
