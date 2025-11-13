"use client"

import { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { MemberEmailsDraftDto } from "@/services/dto/store-draft.dto"

type StepOneFormProps = {
  storeName: string
  members: string[]
  memberEmailStatuses: MemberEmailsDraftDto[]
  onStoreNameChange: (value: string) => void
  onMemberChange: (index: number, value: string) => void
  onAddMember: () => void
  onRemoveMember: (index: number) => void
  onNext: () => Promise<void> | void
  saving: boolean
  canSubmit?: boolean
  errorMessage?: string | null
}

export function StepOneForm({
  storeName,
  members,
  memberEmailStatuses,
  onStoreNameChange,
  onMemberChange,
  onAddMember,
  onRemoveMember,
  onNext,
  saving,
  canSubmit = true,
  errorMessage = null,
}: StepOneFormProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onNext()
  }

  const submitDisabled = saving || !canSubmit

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-800">Create your store team</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="storeName">Store name</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(event) => onStoreNameChange(event.target.value)}
              placeholder="Kaset Fair Store"
              required
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label>Member emails</Label>
              <p className="mt-1 text-sm text-emerald-700">
                Invite at least 3 members using their KU Gmail accounts. You can add more teammates at any
                time.
              </p>
            </div>

            <div className="space-y-3">
              {members.map((member, index) => {
                const canRemove = members.length > 3 && index >= 3
                const emailStatus = memberEmailStatuses.find(
                  (m) => m.email.trim().toLowerCase() === member.trim().toLowerCase()
                )
                const showWarning = emailStatus && emailStatus.status !== "joined"

                return (
                  <div key={`member-${index}`} className="space-y-1">
                    {showWarning && (
                      <p className="text-xs text-red-600 ml-1">
                        This email is currently <strong>{emailStatus.status}</strong>.
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <Input
                        type="email"
                        placeholder={`Member email ${index + 1}`}
                        value={member}
                        onChange={(event) => onMemberChange(index, event.target.value)}
                        required={index < 3}
                        className={
                          showWarning
                            ? "border-red-400 focus-visible:ring-red-400"
                            : ""
                        }
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
              Add another member
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={submitDisabled}
          >
            {saving ? "Saving..." : "Next"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
