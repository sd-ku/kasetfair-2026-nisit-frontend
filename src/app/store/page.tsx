// src/app/store/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { GoodsResponseDto, GoodsType } from "@/services/dto/goods.dto"
import type { StoreResponseDto } from "@/services/dto/store-info.dto"
import {
  createGood,
  deleteGood,
  getStoreStatus,
  listGoods,
  updateGood,
  updateStore,
  extractErrorMessage,
} from "@/services/storeServices"

type GoodDraft = {
  name: string
  price: string
  type: GoodsType
}

type DraftNewGood = {
  tempId: string
  name: string
  price: string
}

// const GOODS_TYPE_OPTIONS: { label: string; value: GoodsType }[] = [
//   { label: "อาหาร (Food)", value: "Food" },
//   { label: "สินค้าอื่นๆ (NonFood)", value: "NonFood" },
// ]

const createDraftNewGood = (): DraftNewGood => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  price: "",
})

const ensureMemberFields = (emails: string[]): string[] =>
  emails.length ? emails : [""]

export default function StorePage() {
  const [store, setStore] = useState<StoreResponseDto | null>(null)
  const [storeName, setStoreName] = useState("")
  const [storeMembers, setStoreMembers] = useState<string[]>([""])
  const [loadingStore, setLoadingStore] = useState(true)
  const [savingStore, setSavingStore] = useState(false)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [storeMessage, setStoreMessage] = useState<string | null>(null)

  const [goods, setGoods] = useState<GoodsResponseDto[]>([])
  const [goodDrafts, setGoodDrafts] = useState<Record<string, GoodDraft>>({})
  const [loadingGoods, setLoadingGoods] = useState(true)
  const [goodsError, setGoodsError] = useState<string | null>(null)
  const [goodsMessage, setGoodsMessage] = useState<string | null>(null)
  const [savingGoodsMap, setSavingGoodsMap] = useState<Record<string, boolean>>({})
  const [deletingGoodsMap, setDeletingGoodsMap] = useState<Record<string, boolean>>({})
  const [draftNewGoods, setDraftNewGoods] = useState<DraftNewGood[]>([])
  const [savingAllGoods, setSavingAllGoods] = useState(false)
  const totalProductRows = goods.length + draftNewGoods.length

  const router = useRouter()

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
    const nextMembers =
      nextStore.members?.map((member) => member.email) ?? []
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
      const status =
        (error as { response?: { status?: number } })?.response?.status ?? null
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

  const fetchGoods = useCallback(async () => {
    setLoadingGoods(true)
    setGoodsError(null)
    setGoodsMessage(null)
    try {
      const data = await listGoods()
      setGoods(data)
      setGoodDrafts(
        data.reduce<Record<string, GoodDraft>>((acc, item) => {
          acc[item.id] = {
            name: item.name ?? "",
            price: item.price?.toString() ?? "",
            type: item.type,
          }
          return acc
        }, {})
      )
    } catch (error) {
      setGoodsError(extractErrorMessage(error, "ไม่สามารถโหลดสินค้าของร้านได้"))
    } finally {
      setLoadingGoods(false)
    }
  }, [])
    
  const handleSaveAllGoods = async (event?: React.FormEvent<HTMLFormElement>) => {
    // ถ้าต้องการ handle error/report ทีละตัว อนาคตค่อยแตก logic เพิ่มได้
    event?.preventDefault()
    setSavingAllGoods(true)
    try {
      await Promise.all([
        ...goods.map((good) => handleSaveGood(good.id)),
        ...draftNewGoods.map((draft) => handleCreateDraftNewGood(draft)),
      ])
    } finally {
      setSavingAllGoods(false)
    }
  }

  useEffect(() => {
    fetchStore()
    fetchGoods()
  }, [fetchGoods, fetchStore])

  useEffect(() => {
    if (!loadingGoods && goods.length === 0 && draftNewGoods.length === 0) {
      setDraftNewGoods([createDraftNewGood()])
    }
  }, [draftNewGoods, goods, loadingGoods])

  const handleMemberChange = (index: number, value: string) => {
    setStoreMembers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddMember = () => {
    setStoreMembers((prev) => [...prev, ""])
  }

  const handleRemoveMember = (index: number) => {
    setStoreMembers((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, memberIndex) => memberIndex !== index)
    })
  }

  const handleStoreSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!store) return

    const trimmedName = storeName.trim()
    const memberEmails = storeMembers
      .map((email) => email.trim())
      .filter(Boolean)

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

  const handleGoodDraftChange = useCallback(
    <K extends keyof GoodDraft>(id: string, field: K, value: GoodDraft[K]) => {
      setGoodDrafts((prev) => {
        const existing = prev[id] ?? { name: "", price: "", type: "Food" }
        return {
          ...prev,
          [id]: {
            ...existing,
            [field]: value,
          },
        }
      })
    },
    []
  )

  const handleSaveGood = async (goodId: string) => {
    const draft = goodDrafts[goodId]
    if (!draft) return

    const trimmedName = draft.name.trim()
    const parsedPrice = Number(draft.price)

    if (!trimmedName) {
      setGoodsError("กรุณากรอกชื่อสินค้า")
      return
    }
    if (typeof parsedPrice !== "number" || Number.isNaN(parsedPrice)) {
      setGoodsError("กรุณากรอกราคาสินค้าให้ถูกต้อง")
      return
    }

    setGoodsError(null)
    setGoodsMessage(null)
    setSavingGoodsMap((prev) => ({ ...prev, [goodId]: true }))

    try {
      const updated = await updateGood(goodId, {
        name: trimmedName,
        price: parsedPrice,
        type: draft.type,
      })
      setGoods((prev) =>
        prev.map((good) => (good.id === goodId ? updated : good))
      )
      setGoodDrafts((prev) => ({
        ...prev,
        [goodId]: {
          name: updated.name,
          price: updated.price,
          type: updated.type,
        },
      }))
      setGoodsMessage("บันทึกข้อมูลสินค้าสำเร็จ")
    } catch (error) {
      setGoodsError(extractErrorMessage(error, "ไม่สามารถบันทึกข้อมูลสินค้าได้"))
    } finally {
      setSavingGoodsMap((prev) => ({ ...prev, [goodId]: false }))
    }
  }

  const handleDeleteGood = async (goodId: string) => {
    if (!window.confirm("ต้องการลบสินค้านี้หรือไม่?")) return
    setGoodsError(null)
    setGoodsMessage(null)
    setDeletingGoodsMap((prev) => ({ ...prev, [goodId]: true }))

    try {
      await deleteGood(goodId)
      setGoods((prev) => prev.filter((good) => good.id !== goodId))
      setGoodDrafts((prev) => {
        const next = { ...prev }
        delete next[goodId]
        return next
      })
      setGoodsMessage("ลบสินค้าเรียบร้อยแล้ว")
    } catch (error) {
      setGoodsError(extractErrorMessage(error, "ไม่สามารถลบสินค้าได้"))
    } finally {
      setDeletingGoodsMap((prev) => ({ ...prev, [goodId]: false }))
    }
  }

  const handleCreateDraftNewGood = async (draft: DraftNewGood) => {
    const trimmedName = draft.name.trim()
    const parsedPrice = Number(draft.price)

    if (!trimmedName) {
        setGoodsError("กรุณากรอกชื่อสินค้า")
        return
    }

    if (typeof parsedPrice !== "number" || Number.isNaN(parsedPrice)) {
        setGoodsError("กรุณากรอกราคาเป็นตัวเลข")
        return
    }

    setGoodsError(null)
    setGoodsMessage(null)

    try {
        const created = await createGood({
        name: trimmedName,
        price: parsedPrice,
        type: "Food",
        })

        setGoods((prev) => [...prev, created])

        setGoodDrafts((prev) => ({
        ...prev,
        [created.id]: {
            name: created.name,
            price: created.price,
            type: created.type,
        },
        }))

        setDraftNewGoods((prev) => prev.filter((item) => item.tempId !== draft.tempId))

        setGoodsMessage("เพิ่มสินค้าสำเร็จ")
    } catch (error) {
        setGoodsError(
        extractErrorMessage(error, "ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่อีกครั้ง")
        )
    }
  }

  const handleAddDraftNewGood = () => {
    setDraftNewGoods((prev) => [...prev, createDraftNewGood()])
  }

  const handleDraftNewGoodChange = (
    tempId: string,
    key: keyof Omit<DraftNewGood, "tempId">,
    value: string
  ) => {
    setDraftNewGoods((prev) =>
      prev.map((draft) =>
        draft.tempId === tempId
          ? {
              ...draft,
              [key]: value,
            }
          : draft
      )
    )
  }

  const handleRemoveDraftNewGood = (tempId: string) => {
    setDraftNewGoods((prev) => {
      const next = prev.filter((draft) => draft.tempId !== tempId)
      if (next.length === 0 && goods.length === 0) {
        return [createDraftNewGood()]
      }
      return next
    })
  }


  const refreshAll = () => {
    fetchStore()
    fetchGoods()
  }

  const renderLoading = (label: string) => (
    <div className="flex items-center gap-2 text-sm text-emerald-700">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-emerald-100 backdrop-blur">
        <div className="flex items-center gap-3">
            <Button
                type="button"
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push("/home")}
            >
                {/* <ArrowLeft className="h-4 w-4" />
                กลับหน้าแรก */}
                <ArrowLeft />
            
            </Button>

            <div>
                <h1 className="mt-1 text-2xl font-semibold text-emerald-900">
                    จัดการข้อมูลร้านและสินค้า
                </h1>
                <p className="mt-1 text-sm text-emerald-700">
                    ดูสถานะร้าน ปรับปรุงสมาชิก และอัปเดตรายการสินค้าได้จากหน้าเดียว
                </p>
            </div>
        </div>
        </header>

        <Card className="border-emerald-100 shadow-md">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
            <CardTitle className="text-xl text-emerald-900">ข้อมูลร้านค้า</CardTitle>
            <CardDescription className="text-sm">
                ตรวจสอบและแก้ไขข้อมูลพื้นฐานของร้าน รวมถึงอีเมลสมาชิก
            </CardDescription>
            </div>

            {store && (
            <div className="text-right text-sm text-emerald-700">
                สถานะ: {store.state} | ประเภท: {store.type}
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
                {/* Error / Message */}
                {storeError && (
                    <p className="text-sm text-red-600">{storeError}</p>
                )}
                {storeMessage && (
                    <p className="text-sm text-emerald-700">{storeMessage}</p>
                )}

                {/* Store name */}
                <div className="space-y-2">
                    <Label htmlFor="storeName">ชื่อร้าน</Label>
                    <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="กรอกชื่อร้าน"
                    />
                </div>

                {/* Members */}
                <div className="space-y-3">
                    <div>
                    <Label>อีเมลสมาชิก</Label>
                    <p className="mt-1 text-sm text-emerald-700">
                        ต้องมีอย่างน้อย 3 บัญชี และสามารถเพิ่มสมาชิกได้ทุกเมื่อ
                    </p>
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
                            const showWarn =
                            status && typeof status === "string" && status.toLowerCase() !== "joined"

                            // ใช้ลำดับที่ "เห็นบนจอ" ในการตัดสินใจ
                            const canRemove = storeMembers.length > 3 && sortedIndex >= 3

                        return (
                        <div key={`member-${index}`} className="space-y-1">
                            {status && (
                            <p
                                className={`ml-1 text-xs ${
                                showWarn ? "text-red-600" : "text-emerald-700"
                                }`}
                            >
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
                                className={
                                showWarn
                                    ? "border-red-400 focus-visible:ring-red-400"
                                    : undefined
                                }
                            />

                            {canRemove && (
                                <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="border-red-200 text-red-500 hover:bg-red-50"
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
                    className="w-full border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={handleAddMember}
                    >
                    <Plus className="h-4 w-4" />
                    เพิ่มสมาชิก
                    </Button>
                </div>
                </>
            )}
            </CardContent>

            {/* Footer */}
            <CardFooter className="mt-6 flex justify-end gap-3">
            {/* <Button
                type="button"
                variant="outline"
                onClick={() => resetStoreForm(store)}
                disabled={savingStore}
            >
                ย้อนกลับค่าเดิม
            </Button> */}
            <Button
                type="submit"
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={savingStore}
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


        <Card className="border-emerald-100 bg-white/90 shadow-xl">
            <CardHeader>
                <CardTitle className="text-emerald-800">จัดการสินค้า</CardTitle>
            </CardHeader>

            <form onSubmit={handleSaveAllGoods}>
                <CardContent className="space-y-4">
                {goodsError && <p className="text-sm text-red-600">{goodsError}</p>}
                {goodsMessage && <p className="text-sm text-emerald-700">{goodsMessage}</p>}

                {loadingGoods ? (
                    renderLoading("Loading goods...")
                ) : (
                    <>
                    <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3 text-sm text-gray-600">
                        <span>ชื่อสินค้า</span>
                        <span className="text-right">ราคา (บาท)</span>
                        <span className="sr-only">actions</span>
                    </div>

                    <div className="space-y-3">
                        {goods.map((good) => {
                        const draft = goodDrafts[good.id] ?? {
                            name: "",
                            price: "",
                            type: good.type,
                        }

                        return (
                            <div
                            key={good.id}
                            className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3"
                            >
                            <Input
                                placeholder="ชื่อสินค้า"
                                value={draft.name}
                                onChange={(e) => handleGoodDraftChange(good.id, "name", e.target.value)}
                                required
                            />
                            <Input
                                placeholder="ราคา (บาท)"
                                value={draft.price}
                                onChange={(e) => handleGoodDraftChange(good.id, "price", e.target.value)}
                                inputMode="decimal"
                                className="text-right"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => handleDeleteGood(good.id)}
                                disabled={totalProductRows === 1 || !!deletingGoodsMap[good.id]}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        )
                        })}

                        {draftNewGoods.map((draft) => (
                        <div
                            key={draft.tempId}
                            className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3"
                        >
                            <Input
                                placeholder="ชื่อสินค้า"
                                value={draft.name}
                                onChange={(e) => handleDraftNewGoodChange(draft.tempId, "name", e.target.value)}
                                required
                            />
                            <Input
                                placeholder="ราคา (บาท)"
                                value={draft.price}
                                onChange={(e) => handleDraftNewGoodChange(draft.tempId, "price", e.target.value)}
                                inputMode="decimal"
                                className="text-right"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => handleRemoveDraftNewGood(draft.tempId)}
                                disabled={goods.length === 0 && draftNewGoods.length === 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={handleAddDraftNewGood}
                    >
                        <Plus className="h-4 w-4" />
                        เพิ่มรายการสินค้าใหม่
                    </Button>
                    </>
                )}
                </CardContent>

                <CardFooter className="mt-6 flex justify-end">
                    <Button
                        type="submit"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={savingAllGoods || loadingGoods}
                    >
                        <Save className="h-4 w-4" />
                        {savingAllGoods
                        ? "กำลังบันทึกการเปลี่ยนแปลง..."
                        : "บันทึกการเปลี่ยนแปลง"}
                    </Button>
                </CardFooter>
            </form>
        </Card>

      </div>
    </div>
  )
} 
