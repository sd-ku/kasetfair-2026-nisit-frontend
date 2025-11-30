// page.tsx
"use client"

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StepSuccess } from "@/components/createStep/step-success"
import { getEmailStatusToText } from "@/utils/labelConverter"
import { createStore } from "@/services/storeDraftService"
import { toast } from "@/lib/toast"
import { getStoreStatus } from "@/services/storeServices"
import type { StoreResponseDto } from "@/services/dto/store-info.dto"

export const dynamic = 'force-dynamic'

type MemberStatus = {
  email: string
  status: string
}

const STORAGE_KEY_STORE_NAME = "kasetfair_draft_store_name"
const STORAGE_KEY_MEMBERS = "kasetfair_draft_members"

function StoreCreateContent() {
  const router = useRouter()

  // Local state management
  const [storeName, setStoreName] = useState("")
  const [members, setMembers] = useState<string[]>(["", "", ""])
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storeStatus, setStoreStatus] = useState<StoreResponseDto | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const savedStoreName = localStorage.getItem(STORAGE_KEY_STORE_NAME)
    const savedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS)

    if (savedStoreName) {
      setStoreName(savedStoreName)
    }

    if (savedMembers) {
      try {
        const parsed = JSON.parse(savedMembers)
        if (Array.isArray(parsed) && parsed.length >= 3) {
          setMembers(parsed)
        }
      } catch (e) {
        console.error("Failed to parse saved members", e)
      }
    }
  }, [])

  // Check store status
  useEffect(() => {
    (async () => {
      setLoadingStatus(true)
      try {
        const data = await getStoreStatus()
        setStoreStatus(data)

        // If store is pending, clear localStorage
        if (data.state === "Pending") {
          localStorage.removeItem(STORAGE_KEY_STORE_NAME)
          localStorage.removeItem(STORAGE_KEY_MEMBERS)
        }
      } catch (error: any) {
        const status = error?.response?.status ?? null
        if (status !== 404) {
          console.error("Failed to load store status", error)
        }
        // 404 is expected if no store exists yet
      } finally {
        setLoadingStatus(false)
      }
    })()
  }, [])

  const handleMemberChange = useCallback((index: number, value: string) => {
    setMembers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const addMember = useCallback(() => {
    setMembers(prev => [...prev, ""])
  }, [])

  const removeMember = useCallback((index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    const trimmedName = storeName.trim()
    const memberGmails = members.map(email => email.trim()).filter(Boolean)

    // Validation
    if (!trimmedName) {
      const msg = "กรุณากรอกชื่อร้าน"
      setError(msg)
      toast({
        variant: "error",
        description: msg,
      })
      return
    }

    if (memberGmails.length < 3) {
      const msg = "กรุณากรอกอีเมลสมาชิกอย่างน้อย 3 คน"
      setError(msg)
      toast({
        variant: "error",
        description: msg,
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Save to localStorage before submitting
    localStorage.setItem(STORAGE_KEY_STORE_NAME, trimmedName)
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(memberGmails))

    try {
      const payload = {
        storeName: trimmedName,
        type: "Nisit" as const,
        memberGmails,
      }

      const response = await createStore(payload)

      // Success - clear localStorage and redirect
      localStorage.removeItem(STORAGE_KEY_STORE_NAME)
      localStorage.removeItem(STORAGE_KEY_MEMBERS)

      toast({
        variant: "success",
        description: "สร้างร้านค้าสำเร็จ",
      })

      // Reload store status
      const updatedStatus = await getStoreStatus()
      setStoreStatus(updatedStatus)

      // If pending, show success page
      if (updatedStatus.state === "Pending") {
        // The component will re-render and show StepSuccess
        return
      }

      // Otherwise redirect to next step
      router.push("/store/layout")
    } catch (err: any) {
      console.error("Failed to create store", err)

      // Check if error response has member statuses
      const errorData = err?.response?.data

      if (errorData?.members && Array.isArray(errorData.members)) {
        // Update member statuses from error response
        setMemberStatuses(errorData.members)

        // Set error message
        const msg = errorData.message || "ไม่สามารถสร้างร้านได้ โปรดตรวจสอบอีเมลของสมาชิก"
        setError(msg)
        toast({
          variant: "error",
          description: msg,
        })
      } else {
        // Generic error
        const message = errorData?.message || err?.message || "เกิดข้อผิดพลาดระหว่างบันทึกข้อมูล กรุณาลองใหม่"
        setError(message)
        toast({
          variant: "error",
          description: message,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [storeName, members, isSubmitting, router])

  if (loadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <p className="text-emerald-700">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  const isPendingStore = storeStatus?.state === "Pending"

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
          </CardHeader>
        </Card>

        <Card className="border-emerald-100 bg-white/90 shadow-xl">
          <CardHeader className="-mb-2">
            <CardTitle className="text-emerald-800 text-xl font-bold">
              ข้อมูลร้านค้าและสมาชิกทีม
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* STORE NAME */}
              <div className="space-y-2">
                <Label htmlFor="storeName" className="font-semibold text-[15px] text-emerald-900">
                  ชื่อร้านค้า
                </Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  placeholder="เช่น Kaset Fair Drinks"
                  required
                  disabled={isSubmitting}
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
                    คุณสามารถเพิ่มสมาชิกได้ภายหลัง
                  </p>
                </div>

                <div className="space-y-3">
                  {members.map((member, index) => {
                    const canRemove = members.length > 3 && index >= 3
                    const emailStatus = memberStatuses.find(
                      (m) => m.email.trim().toLowerCase() === member.trim().toLowerCase()
                    )
                    const status = emailStatus?.status ?? null
                    const showWarn = status && typeof status === "string" && status.toLowerCase() !== "joined"

                    return (
                      <div key={`member-${index}`} className="space-y-1">
                        {status && (
                          <p className={`ml-1 text-xs ${showWarn ? "text-red-600" : "text-emerald-700"}`}>
                            {"สถานะ: "}
                            <strong>{getEmailStatusToText(status)}</strong>
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <Input
                            type="email"
                            placeholder={`อีเมลสมาชิกคนที่ ${index + 1}`}
                            value={member}
                            onChange={(event) => handleMemberChange(index, event.target.value)}
                            required={index < 3}
                            className={showWarn ? "border-red-400 focus-visible:ring-red-400" : ""}
                            disabled={isSubmitting}
                          />
                          {canRemove && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="border-red-200 text-red-500 hover:bg-red-50"
                              onClick={() => removeMember(index)}
                              disabled={isSubmitting}
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
                  onClick={addMember}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มอีเมลสมาชิก
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end mt-6">
              <Button
                type="submit"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังบันทึกข้อมูล..." : "บันทึกและไปขั้นตอนถัดไป"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function StoreCreatePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-emerald-600">Loading...</div>}>
      <StoreCreateContent />
    </Suspense>
  )
}
