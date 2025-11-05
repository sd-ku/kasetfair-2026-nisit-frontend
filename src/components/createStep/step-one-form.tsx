"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

type StepOneFormProps = {
  storeName: string
  members: string[]
  onStoreNameChange: (value: string) => void
  onMemberChange: (index: number, value: string) => void
  onAddMember: () => void
  onRemoveMember: (index: number) => void
  onNext: () => void
  saving: boolean
}

export function StepOneForm({
  storeName,
  members,
  onStoreNameChange,
  onMemberChange,
  onAddMember,
  onRemoveMember,
  onNext,
  saving,
}: StepOneFormProps) {
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onNext()
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-800">ข้อมูลร้านค้า</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="storeName">ชื่อร้านค้า</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(event) => onStoreNameChange(event.target.value)}
              placeholder="เช่น Kaset Fair Store"
              required
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label>สมาชิกในร้าน</Label>
              <p className="mt-1 text-sm text-emerald-700">
                กรุณากรอกอีเมลของสมาชิกอย่างน้อย 3 คนเพื่อสร้างร้าน
              </p>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => {
                const memberLabel = `อีเมลสมาชิกคนที่ ${index + 1}`
                const canRemove = members.length > 3 && index >= 3
                return (
                  <div key={`member-${index}`} className="flex items-center gap-3">
                    <Input
                      type="email"
                      placeholder={memberLabel}
                      value={member}
                      onChange={(event) => onMemberChange(index, event.target.value)}
                      required={index < 3}
                    />
                    {canRemove && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => onRemoveMember(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={onAddMember}
            >
              <Plus className="h-4 w-4" />
              เพิ่มสมาชิก
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={saving}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกและไปขั้นถัดไป"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
