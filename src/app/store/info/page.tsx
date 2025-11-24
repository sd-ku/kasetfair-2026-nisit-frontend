"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Save, Trash2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

import type { StoreResponseDto } from "@/services/dto/store-info.dto"
import { getStoreStatus, updateStore, extractErrorMessage } from "@/services/storeServices"
import { getNisitInfo } from "@/services/nisitService"
import { isStoreAdmin as isStoreAdminUtil } from "@/utils/storeAdmin"
import { convertStateToLabel, convertStoreTypeToLabel } from "@/utils/labelConverter"

const ensureMemberFields = (emails: string[]): string[] => (emails.length ? emails : [""])

export default function StoreInfoPage() {
  const [store, setStore] = useState<StoreResponseDto | null>(null)
  const [storeName, setStoreName] = useState("")
  const [storeMembers, setStoreMembers] = useState<string[]>([""])
  const [loadingStore, setLoadingStore] = useState(true)
  const [savingStore, setSavingStore] = useState(false)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [storeMessage, setStoreMessage] = useState<string | null>(null)
  const [currentUserNisitId, setCurrentUserNisitId] = useState<string | null>(null)

  const router = useRouter()

  const isStoreAdmin = useMemo(
    () => isStoreAdminUtil(currentUserNisitId, store?.storeAdminNisitId ?? null),
    [currentUserNisitId, store?.storeAdminNisitId],
  )
  const canEditStore = Boolean(store && isStoreAdmin)

  const memberStatusMap = useMemo(() => {
    const map = new Map<string, string>()
    if (store?.members) {
      store.members.forEach((member) => {
        map.set(member.email.trim().toLowerCase(), member.status)
      })
    }
    return map
  }, [store])

  const resetStoreForm = useCallback((nextStore: StoreResponseDto | null) => {
    if (!nextStore) {
      setStoreName("")
      setStoreMembers([""])
      return
    }
    setStoreName(nextStore.storeName ?? "")
    const nextMembers = nextStore.members?.map((member) => member.email) ?? []
    setStoreMembers(ensureMemberFields(nextMembers))
  }, [])

  const fetchStore = useCallback(async () => {
    setLoadingStore(true)
    setStoreError(null)
    setStoreMessage(null)
    try {
      const data = await getStoreStatus()
      setStore(data)
      resetStoreForm(data)
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status ?? null
      if (status === 404) {
        setStore(null)
        setStoreError("ยังไม่มีข้อมูลร้าน กรุณาสร้างร้านผ่านหน้าสร้างร้านก่อน")
        resetStoreForm(null)
      } else {
        setStoreError(extractErrorMessage(error, "ไม่สามารถโหลดข้อมูลร้านได้"))
      }
    } finally {
      setLoadingStore(false)
    }
  }, [resetStoreForm])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  useEffect(() => {
    ; (async () => {
      try {
        const profile = await getNisitInfo()
        if (profile?.nisitId) {
          setCurrentUserNisitId(profile.nisitId)
        }
      } catch (error) {
        console.error("Failed to load current user profile", error)
      }
    })()
  }, [])

  const handleMemberChange = (index: number, value: string) => {
    if (!canEditStore) return
    setStoreMembers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddMember = () => {
    if (!canEditStore) return
    setStoreMembers((prev) => [...prev, ""])
  }

  const handleRemoveMember = (index: number) => {
    if (!canEditStore) return
    setStoreMembers((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, memberIndex) => memberIndex !== index)
    })
  }

  const handleStoreSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!canEditStore) {
      setStoreError("Only the store admin can update store information.")
      return
    }
    if (!store) return

    const trimmedName = storeName.trim()
    const memberEmails = storeMembers.map((email) => email.trim()).filter(Boolean)

    if (!trimmedName) {
      setStoreError("กรุณากรอกชื่อร้าน")
      return
    }

    if (!memberEmails.length) {
      setStoreError("กรุณาระบุอีเมลสมาชิกอย่างน้อย 1 คน")
      return
    }

    setSavingStore(true)
    setStoreError(null)
    setStoreMessage(null)

    try {
      const updated = await updateStore({
        storeName: trimmedName,
        memberEmails,
      })
      setStore(updated)
      resetStoreForm(updated)
      setStoreMessage("บันทึกข้อมูลร้านเรียบร้อยแล้ว")
    } catch (error) {
      setStoreError(extractErrorMessage(error, "ไม่สามารถบันทึกข้อมูลร้านได้"))
    } finally {
      setSavingStore(false)
    }
  }

  const renderLoading = (label: string) => (
    <div className="flex items-center gap-2 text-sm text-emerald-700">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => router.push("/store")}
            >
              <ArrowLeft />
            </Button>

            <div className="space-y-1">
              <h1 className="mt-1 text-2xl font-semibold text-emerald-900">
                แก้ไขข้อมูลร้านค้า
              </h1>
              <p className="mt-1 text-sm text-emerald-700">
                ดูสถานะร้าน ปรับปรุงสมาชิก
              </p>
              {store?.storeAdminNisitId && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50/50 px-4 py-3 border border-emerald-100">
                  <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-700 font-medium">
                    Store Admin
                  </Badge>
                  <span className="text-sm font-medium text-emerald-800">{store.storeAdminNisitId}</span>
                  {isStoreAdmin && (
                    <Badge variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700">
                      You
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <Card className="border-emerald-100 shadow-md">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl text-emerald-900">ข้อมูลทั่วไป</CardTitle>
              <CardDescription className="text-sm">ตรวจสอบและแก้ไขข้อมูลพื้นฐานของร้าน รวมถึงอีเมลสมาชิก</CardDescription>
            </div>

            {store && (
              <div className="text-right text-sm text-emerald-700">
                สถานะ: {convertStateToLabel(store.state)} | ประเภท: {convertStoreTypeToLabel(store.type)}
                {store.boothNumber && <p>บูธ: {store.boothNumber}</p>}
              </div>
            )}
          </CardHeader>

          <form className="space-y-6" onSubmit={handleStoreSubmit}>
            <CardContent className="space-y-4">
              {loadingStore ? (
                renderLoading("กำลังโหลดข้อมูลร้าน...")
              ) : !store ? (
                <div className="rounded-xl border border-dashed border-emerald-200 bg-white/70 p-5 text-sm text-emerald-800">
                  <p>ยังไม่มีข้อมูลร้าน โปรดสร้างร้านผ่านขั้นตอนการลงทะเบียนก่อน</p>
                </div>
              ) : (
                <>
                  {storeError && <p className="text-sm text-red-600">{storeError}</p>}
                  {storeMessage && <p className="text-sm text-emerald-700">{storeMessage}</p>}

                  <div className="space-y-2">
                    <Label htmlFor="storeName">ชื่อร้าน</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="กรอกชื่อร้าน"
                      disabled={!canEditStore}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>อีเมลสมาชิก</Label>
                      <p className="mt-1 text-sm text-emerald-700">ต้องมีอย่างน้อย 3 บัญชี และสามารถเพิ่มสมาชิกได้ทุกเมื่อ</p>
                    </div>

                    <div className="space-y-3">
                      {storeMembers
                        .map((email, index) => {
                          const normalized = email.trim().toLowerCase()
                          const status = memberStatusMap.get(normalized) ?? null
                          return { email, index, status }
                        })
                        .sort((a, b) => {
                          const aJoined = a.status?.toLowerCase() === "joined"
                          const bJoined = b.status?.toLowerCase() === "joined"

                          if (aJoined && !bJoined) return -1
                          if (!aJoined && bJoined) return 1
                          return 0
                        })
                        .map(({ email, index, status }, sortedIndex) => {
                          const showWarn = status && typeof status === "string" && status.toLowerCase() !== "joined"
                          const canRemove = storeMembers.length > 3 && sortedIndex >= 3

                          return (
                            <div key={`member-${index}`} className="space-y-1">
                              {status && (
                                <p className={`ml-1 text-xs ${showWarn ? "text-red-600" : "text-emerald-700"}`}>
                                  {showWarn ? "อีเมลนี้ยังไม่ยืนยัน: " : "สถานะสมาชิก: "}
                                  <strong>{status}</strong>
                                </p>
                              )}

                              <div className="flex items-center gap-3">
                                <Input
                                  type="email"
                                  placeholder={`Member email ${index + 1}`}
                                  value={email}
                                  onChange={(e) => handleMemberChange(index, e.target.value)}
                                  required={index < 3}
                                  className={showWarn ? "border-red-400 focus-visible:ring-red-400" : undefined}
                                  disabled={!canEditStore}
                                />

                                {canRemove && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="border-red-200 text-red-500 hover:bg-red-50 bg-transparent"
                                    disabled={!canEditStore}
                                    onClick={() => {
                                      if (window.confirm("ต้องการลบสมาชิกคนนี้จริงหรือไม่?")) {
                                        handleRemoveMember(index)
                                      }
                                    }}
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
                      className="w-full border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                      onClick={handleAddMember}
                      disabled={!canEditStore}
                    >
                      <Plus className="h-4 w-4" />
                      เพิ่มสมาชิก
                    </Button>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="mt-6 flex justify-end gap-3">
              <Button
                type="submit"
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={savingStore || !canEditStore}
              >
                {savingStore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึกการเปลี่ยนแปลง...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
