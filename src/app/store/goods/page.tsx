"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, Save, Trash2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import type { GoodsResponseDto, GoodsType } from "@/services/dto/goods.dto"
import { createGood, deleteGood, listGoods, updateGood, extractErrorMessage } from "@/services/storeServices"

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

const createDraftNewGood = (): DraftNewGood => ({
  tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  price: "",
})

export default function StoreGoodsPage() {
  const [goods, setGoods] = useState<GoodsResponseDto[]>([])
  const [goodDrafts, setGoodDrafts] = useState<Record<string, GoodDraft>>({})
  const [loadingGoods, setLoadingGoods] = useState(true)
  const [goodsError, setGoodsError] = useState<string | null>(null)
  const [goodsMessage, setGoodsMessage] = useState<string | null>(null)
  const [savingGoodsMap, setSavingGoodsMap] = useState<Record<string, boolean>>({})
  const [deletingGoodsMap, setDeletingGoodsMap] = useState<Record<string, boolean>>({})
  const [draftNewGoods, setDraftNewGoods] = useState<DraftNewGood[]>([])
  const [goodFieldErrors, setGoodFieldErrors] = useState<Record<string, { name?: string; price?: string }>>({})
  const [savingAllGoods, setSavingAllGoods] = useState(false)
  const [goodRowErrors, setGoodRowErrors] = useState<Record<string, string>>({})

  const router = useRouter()

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
        }, {}),
      )
      setGoodFieldErrors({})
    } catch (error) {
      setGoodsError(extractErrorMessage(error, "ไม่สามารถโหลดสินค้าของร้านได้"))
    } finally {
      setLoadingGoods(false)
    }
  }, [])

  useEffect(() => {
    fetchGoods()
  }, [fetchGoods])

  useEffect(() => {
    if (!loadingGoods && goods.length === 0 && draftNewGoods.length === 0) {
      setDraftNewGoods([createDraftNewGood()])
    }
  }, [draftNewGoods, goods, loadingGoods])

  const handleGoodDraftChange = useCallback(<K extends keyof GoodDraft>(id: string, field: K, value: GoodDraft[K]) => {
    setGoodRowErrors((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })

    setGoodFieldErrors((prev) => {
      const next = { ...prev }
      if (next[id]) {
        const updated = { ...next[id], [field]: undefined }
        if (!updated.name && !updated.price) {
          delete next[id]
        } else {
          next[id] = updated
        }
      }
      return next
    })

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
  }, [])

  const handleSaveGood = async (goodId: string) => {
    const draft = goodDrafts[goodId]
    if (!draft) return

    const trimmedName = draft.name.trim()
    const parsedPrice = Number(draft.price)

    if (!trimmedName) {
      setGoodFieldErrors((prev) => ({
        ...prev,
        [goodId]: { ...(prev[goodId] ?? {}), name: "กรุณากรอกชื่อสินค้า" },
      }))
      setGoodsError(null)
      return
    }
    if (typeof parsedPrice !== "number" || Number.isNaN(parsedPrice)) {
      setGoodFieldErrors((prev) => ({
        ...prev,
        [goodId]: { ...(prev[goodId] ?? {}), price: "กรุณากรอกราคาสินค้าให้ถูกต้อง" },
      }))
      setGoodsError(null)
      return
    }

    setGoodsError(null)
    setGoodsMessage(null)
    setGoodRowErrors((prev) => {
      const next = { ...prev }
      delete next[goodId]
      return next
    })
    setSavingGoodsMap((prev) => ({ ...prev, [goodId]: true }))

    try {
      const updated = await updateGood(goodId, {
        name: trimmedName,
        price: parsedPrice,
        type: draft.type,
      })

      setGoods((prev) => prev.map((good) => (good.id === goodId ? updated : good)))

      setGoodFieldErrors((prev) => {
        const next = { ...prev }
        delete next[goodId]
        return next
      })
      setGoodDrafts((prev) => ({
        ...prev,
        [goodId]: {
          name: updated.name,
          price: updated.price,
          type: updated.type,
        },
      }))
    } catch (error) {
      const msg = extractErrorMessage(error, "ไม่สามารถบันทึกสินค้านี้ได้ กรุณาลองใหม่หรือลองรีหน้า")
      setGoodRowErrors((prev) => ({
        ...prev,
        [goodId]: msg,
      }))
      throw error
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
      setGoodFieldErrors((prev) => ({
        ...prev,
        [draft.tempId]: { ...(prev[draft.tempId] ?? {}), name: "กรุณากรอกชื่อสินค้า" },
      }))
      setGoodsError(null)
      return
    }

    if (typeof parsedPrice !== "number" || Number.isNaN(parsedPrice)) {
      setGoodFieldErrors((prev) => ({
        ...prev,
        [draft.tempId]: {
          ...(prev[draft.tempId] ?? {}),
          price: "กรุณากรอกราคาเป็นตัวเลข",
        },
      }))
      setGoodsError(null)
      return
    }

    setGoodsError(null)
    setGoodsMessage(null)
    setGoodRowErrors((prev) => {
      const next = { ...prev }
      delete next[draft.tempId]
      return next
    })

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

      setGoodFieldErrors((prev) => {
        const next = { ...prev }
        delete next[draft.tempId]
        return next
      })

      setGoodRowErrors((prev) => {
        const next = { ...prev }
        delete next[draft.tempId]
        return next
      })
    } catch (error) {
      const msg = extractErrorMessage(error, "ไม่สามารถเพิ่มสินค้านี้ได้ กรุณาลองใหม่")
      setGoodRowErrors((prev) => ({
        ...prev,
        [draft.tempId]: msg,
      }))
      throw error
    }
  }

  const handleAddDraftNewGood = () => {
    setDraftNewGoods((prev) => [...prev, createDraftNewGood()])
  }

  const handleDraftNewGoodChange = (tempId: string, key: keyof Omit<DraftNewGood, "tempId">, value: string) => {
    setGoodRowErrors((prev) => {
      if (!prev[tempId]) return prev
      const next = { ...prev }
      delete next[tempId]
      return next
    })

    setDraftNewGoods((prev) =>
      prev.map((draft) =>
        draft.tempId === tempId
          ? {
              ...draft,
              [key]: value,
            }
          : draft,
      ),
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
    setGoodFieldErrors((prev) => {
      const next = { ...prev }
      delete next[tempId]
      return next
    })
  }

  const handleSaveAllGoods = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setGoodsError("")
    setGoodsMessage("")
    setSavingAllGoods(true)

    try {
      const dirtyExistingGoods = goods.filter((good) => {
        const draft = goodDrafts[good.id]
        if (!draft) return false

        const nameChanged = draft.name.trim() !== good.name
        const priceChanged = Number(draft.price) !== Number(good.price)
        return nameChanged || priceChanged
      })

      const validNewDrafts = draftNewGoods.filter((draft) => draft.name.trim() !== "" && draft.price.trim() !== "")

      const updateResults = await Promise.allSettled(dirtyExistingGoods.map((good) => handleSaveGood(good.id)))

      const createResults = await Promise.allSettled(validNewDrafts.map((draft) => handleCreateDraftNewGood(draft)))

      const allResults = [...updateResults, ...createResults]

      const successCount = allResults.filter((r) => r.status === "fulfilled").length
      const failure = allResults.filter((r) => r.status === "rejected") as PromiseRejectedResult[]

      if (failure.length > 0) {
        setGoodsError(
          `บันทึกสำเร็จ ${successCount} รายการ แต่มี ${failure.length} รายการบันทึกไม่สำเร็จ อาจถูกลบไปแล้วหรือเกิดข้อผิดพลาด กรุณารีหน้าเพื่อตรวจสอบอีกครั้ง`,
        )
      } else {
        setGoodsMessage(`บันทึกการเปลี่ยนแปลงสำเร็จ ${successCount} รายการ`)
      }
    } finally {
      setSavingAllGoods(false)
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

            <div className="space-y-2">
                <h1 className="mt-1 text-2xl font-semibold text-emerald-900">
                    จัดการสินค้าในร้าน
                </h1>
                <p className="mt-1 text-sm text-emerald-700">
                    เพิ่ม แก้ไข หรือลบรายการสินค้า พร้อมอัปเดตราคาได้จากหน้านี้
                </p>
            </div>
          </div>
        </header>

        <Card className="border-emerald-100 bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-emerald-800">รายการสินค้า</CardTitle>
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
                      const fieldErrors = goodFieldErrors[good.id]
                      const rowError = goodRowErrors[good.id]

                      return (
                        <div
                          key={good.id}
                          className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_auto] items-start gap-3"
                        >
                          <div className="flex flex-col gap-1">
                            <Input
                              placeholder="ชื่อสินค้า"
                              value={draft.name}
                              onChange={(e) => handleGoodDraftChange(good.id, "name", e.target.value)}
                              required
                              className={fieldErrors?.name ? "border-red-400 focus-visible:ring-red-400" : ""}
                            />
                            {fieldErrors?.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
                          </div>

                          <div className="flex flex-col gap-1">
                            <Input
                              placeholder="ราคา (บาท)"
                              value={draft.price}
                              onChange={(e) => handleGoodDraftChange(good.id, "price", e.target.value)}
                              inputMode="decimal"
                              className={`text-right ${
                                fieldErrors?.price ? "border-red-400 focus-visible:ring-red-400" : ""
                              }`}
                              required
                            />
                            {fieldErrors?.price && (
                              <p className="text-xs text-red-600 text-right">{fieldErrors.price}</p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteGood(good.id)}
                            disabled={goods.length === 0 && draftNewGoods.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {rowError && <p className="col-span-3 text-xs text-red-600">{rowError}</p>}
                        </div>
                      )
                    })}

                    {draftNewGoods.map((draft) => {
                      const fieldErrors = goodFieldErrors[draft.tempId]
                      const rowError = goodRowErrors[draft.tempId]

                      return (
                        <div
                          key={draft.tempId}
                          className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_auto] items-start gap-3"
                        >
                          <div className="flex flex-col gap-1">
                            <Input
                              placeholder="ชื่อสินค้า"
                              value={draft.name}
                              onChange={(e) => handleDraftNewGoodChange(draft.tempId, "name", e.target.value)}
                              required
                              className={fieldErrors?.name ? "border-red-400 focus-visible:ring-red-400" : ""}
                            />
                            {fieldErrors?.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
                          </div>

                          <div className="flex flex-col gap-1">
                            <Input
                              placeholder="ราคา (บาท)"
                              value={draft.price}
                              onChange={(e) => handleDraftNewGoodChange(draft.tempId, "price", e.target.value)}
                              inputMode="decimal"
                              className={`text-right ${
                                fieldErrors?.price ? "border-red-400 focus-visible:ring-red-400" : ""
                              }`}
                              required
                            />
                            {fieldErrors?.price && (
                              <p className="text-xs text-red-600 text-right">{fieldErrors.price}</p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleRemoveDraftNewGood(draft.tempId)}
                            disabled={goods.length === 0 && draftNewGoods.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {rowError && <p className="col-span-3 text-xs text-red-600">{rowError}</p>}
                        </div>
                      )
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
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
                {savingAllGoods ? "กำลังบันทึกการเปลี่ยนแปลง..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
