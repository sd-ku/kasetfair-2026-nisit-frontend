"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, Save, Trash2, ArrowLeft, Utensils, ImageIcon, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GoogleFileUpload } from "@/components/uploadFile"
import { MediaPurpose } from "@/services/dto/media.dto"
import { getMediaUrl, uploadMediaViaPresign } from "@/services/mediaService"
import type { GoodsResponseDto, GoodsType } from "@/services/dto/goods.dto"
import { createGood, deleteGood, listGoods, updateGood, extractErrorMessage } from "@/services/storeServices"

type GoodDraft = {
  name: string
  price: string
  type: GoodsType
  goodMediaId?: string | null
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
  const [goodImageUrls, setGoodImageUrls] = useState<Record<string, string>>({})
  const [loadingGoods, setLoadingGoods] = useState(true)
  const [goodsError, setGoodsError] = useState<string | null>(null)
  const [goodsMessage, setGoodsMessage] = useState<string | null>(null)
  const [savingGoodsMap, setSavingGoodsMap] = useState<Record<string, boolean>>({})
  const [deletingGoodsMap, setDeletingGoodsMap] = useState<Record<string, boolean>>({})
  const [draftNewGoods, setDraftNewGoods] = useState<DraftNewGood[]>([])
  const [goodFieldErrors, setGoodFieldErrors] = useState<Record<string, { name?: string; price?: string }>>({})
  const [savingAllGoods, setSavingAllGoods] = useState(false)
  const [goodRowErrors, setGoodRowErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [goodUploadingMap, setGoodUploadingMap] = useState<Record<string, boolean>>({})
  const [goodUploadErrors, setGoodUploadErrors] = useState<Record<string, string | null>>({})

  const router = useRouter()

  const loadGoodImages = useCallback(async (items: GoodsResponseDto[]) => {
    const goodsWithMedia = items.filter((item) => item.goodMediaId)
    if (goodsWithMedia.length === 0) {
      setGoodImageUrls({})
      return
    }

    try {
      const entries = await Promise.all(
        goodsWithMedia.map(async (item) => {
          try {
            const media = await getMediaUrl(item.goodMediaId as string)
            return { id: item.id, url: media.link ?? "" }
          } catch (error) {
            console.error(`Failed to load media for good ${item.goodMediaId}`, error)
            return { id: item.id, url: "" }
          }
        }),
      )

      setGoodImageUrls(
        entries.reduce<Record<string, string>>((acc, entry) => {
          if (entry.url) {
            acc[entry.id] = entry.url
          }
          return acc
        }, {}),
      )
    } catch (error) {
      console.error("Failed to load goods media", error)
    }
  }, [])

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
            goodMediaId: item.goodMediaId,
          }
          return acc
        }, {}),
      )
      await loadGoodImages(data)
      setGoodFieldErrors({})
    } catch (error) {
      setGoodsError(extractErrorMessage(error, "ไม่สามารถโหลดสินค้าของร้านได้"))
    } finally {
      setLoadingGoods(false)
    }
  }, [loadGoodImages])

  useEffect(() => {
    fetchGoods()
  }, [fetchGoods])

  useEffect(() => {
    if (!loadingGoods && goods.length === 0 && draftNewGoods.length === 0) {
      setDraftNewGoods([createDraftNewGood()])
    }
  }, [draftNewGoods, goods, loadingGoods])

  const handleGoodFileChange = useCallback(
    async (goodId: string, files: File[]) => {
      if (!files || files.length === 0) return

      const file = files[0]
      setGoodUploadErrors((prev) => ({ ...prev, [goodId]: null }))
      setGoodUploadingMap((prev) => ({ ...prev, [goodId]: true }))

      try {
        const uploadRes = await uploadMediaViaPresign({
          purpose: MediaPurpose.STORE_GOODS,
          file,
        })

        if (!uploadRes?.mediaId) {
          throw new Error("�1,�,Y�,��1O�,-�,�1^�,-�,�,>�1,�,��,��,\"�,��,�,�,�,�,��,��1^")
        }

        setGoodDrafts((prev) => ({
          ...prev,
          [goodId]: {
            ...(prev[goodId] ?? { name: "", price: "", type: "Food", goodMediaId: null }),
            goodMediaId: uploadRes.mediaId,
          },
        }))

        setGoodImageUrls((prev) => ({
          ...prev,
          [goodId]: URL.createObjectURL(file),
        }))
      } catch (error) {
        console.error("Failed to upload good image", error)
        setGoodUploadErrors((prev) => ({
          ...prev,
          [goodId]: extractErrorMessage(error, "�1?�,?�,'�,"�,,�1%�,-�,o�,'�,\"�,z�,��,��,\"�,��,��,��,�1^�,��,؅,s�,�,T�,-�,�,?"),
        }))
      } finally {
        setGoodUploadingMap((prev) => ({ ...prev, [goodId]: false }))
      }
    },
    [],
  )

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
      const existing = prev[id] ?? { name: "", price: "", type: "Food", goodMediaId: null }
      return {
        ...prev,
        [id]: {
          ...existing,
          [field]: value,
        },
      }
    })
  }, [])

  const handleStartEdit = (id: string) => {
    setEditingId(id)
    setGoodsError(null)
    setGoodsMessage(null)
  }

  const handleCancelEdit = (id: string) => {
    setEditingId(null)
    // Reset draft to original value
    const original = goods.find((g) => g.id === id)
    if (original) {
      setGoodDrafts((prev) => ({
        ...prev,
        [id]: {
          name: original.name,
          price: original.price.toString(),
          type: original.type,
          goodMediaId: original.goodMediaId,
        },
      }))
    }
  }

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
        goodMediaId: draft.goodMediaId,
      })

      setGoods((prev) => {
        const next = prev.map((good) => (good.id === goodId ? updated : good))
        loadGoodImages(next)
        return next
      })

      setEditingId(null)

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
          goodMediaId: updated.goodMediaId,
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
      setGoods((prev) => {
        const next = prev.filter((good) => good.id !== goodId)
        loadGoodImages(next)
        return next
      })
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

      setGoods((prev) => {
        const next = [...prev, created]
        loadGoodImages(next)
        return next
      })

      setGoodDrafts((prev) => ({
        ...prev,
        [created.id]: {
          name: created.name,
          price: created.price,
          type: created.type,
          goodMediaId: created.goodMediaId,
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-8 pb-24">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-white/50"
              onClick={() => router.push("/store")}
            >
              <ArrowLeft className="h-6 w-6 text-emerald-900" />
            </Button>
            <h1 className="text-2xl font-bold text-emerald-900">รายการอาหาร</h1>
          </div>
          {/* <Button
            onClick={(e) => handleSaveAllGoods(e as any)}
            className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-md rounded-full px-6"
            disabled={savingAllGoods || loadingGoods}
          >
            {savingAllGoods ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                บันทึกการแก้ไข
              </>
            )}
          </Button> */}
        </div>

        {goodsError && <div className="rounded-lg bg-red-50 p-4 text-red-600 border border-red-100">{goodsError}</div>}
        {goodsMessage && (
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-700 border border-emerald-100">{goodsMessage}</div>
        )}

        {loadingGoods ? (
          <div className="flex h-64 items-center justify-center">{renderLoading("กำลังโหลดรายการอาหาร...")}</div>
        ) : (
          <form
            onSubmit={handleSaveAllGoods}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {/* Existing Goods */}
            {goods.map((good) => {
              const draft = goodDrafts[good.id] ?? {
                name: "",
                price: "",
                type: good.type,
                goodMediaId: good.goodMediaId,
              }
              const fieldErrors = goodFieldErrors[good.id]
              const rowError = goodRowErrors[good.id]
              const deleting = deletingGoodsMap[good.id]
              const saving = savingGoodsMap[good.id]
              const isEditing = editingId === good.id
              const imageUrl = goodImageUrls[good.id]
              const uploading = goodUploadingMap[good.id]

              return (
                <Card
                  key={good.id}
                  className={`group relative overflow-hidden border-0 bg-white rounded-xl flex flex-col transition-all duration-200 ${
                    isEditing ? "ring-2 ring-emerald-500 shadow-lg z-10" : "shadow-md hover:shadow-xl"
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={draft.name || "Good image"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                    {!imageUrl && <Utensils className="h-12 w-12 text-gray-300" />}
                    {isEditing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-2">
                        <GoogleFileUpload
                          maxFiles={1}
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onFilesChange={(files) => handleGoodFileChange(good.id, files)}
                          disabled={uploading}
                          className="w-full max-h-full overflow-auto bg-transparent"
                        />
                      </div>
                    )}

                    {!isEditing && (
                      <Button
                        type="button"
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-transform hover:scale-110 z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(good.id)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <CardContent className="p-2 space-y-1.5 flex-1 flex flex-col">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">ชื่อเมนู</label>
                            <Input
                              value={draft.name}
                              onChange={(e) => handleGoodDraftChange(good.id, "name", e.target.value)}
                              placeholder="ชื่ออาหาร"
                              className={`h-8 text-xs px-2 ${fieldErrors?.name ? "border-red-500" : ""}`}
                              autoFocus
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500">ราคา</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">฿</span>
                              <Input
                                value={draft.price}
                                onChange={(e) => handleGoodDraftChange(good.id, "price", e.target.value)}
                                placeholder="0"
                                inputMode="decimal"
                                className={`h-8 pl-5 text-xs ${fieldErrors?.price ? "border-red-500" : ""}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 pt-1 mt-auto">
                          <Button
                            type="button"
                            onClick={() => handleSaveGood(good.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] px-0"
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "บันทึก"}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-md shrink-0"
                            onClick={() => handleDeleteGood(good.id)}
                            disabled={deleting}
                          >
                            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCancelEdit(good.id)}
                            className="h-7 w-7 p-0 shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div
                        className="flex flex-col h-full justify-between cursor-pointer"
                        onClick={() => handleStartEdit(good.id)}
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
                            {draft.name || <span className="text-gray-400 italic">ไม่มีชื่อ</span>}
                          </h3>
                        </div>
                        <div className="flex items-end justify-between mt-2">
                          <p className="text-lg font-bold text-emerald-600">฿{Number(draft.price).toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {rowError && <p className="text-xs text-red-500 mt-1">{rowError}</p>}
                    {goodUploadErrors[good.id] && <p className="text-[11px] text-red-500">{goodUploadErrors[good.id]}</p>}
                  </CardContent>
                </Card>
              )
            })}

            {/* New Drafts */}
            {draftNewGoods.map((draft) => {
              const fieldErrors = goodFieldErrors[draft.tempId]
              const rowError = goodRowErrors[draft.tempId]

              return (
                <Card
                  key={draft.tempId}
                  className="group relative overflow-hidden border-0 bg-white shadow-lg ring-2 ring-emerald-500/20 rounded-xl flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full bg-emerald-50 flex items-center justify-center overflow-hidden">
                    <ImageIcon className="h-10 w-10 text-emerald-200" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-white/80"
                      onClick={() => handleRemoveDraftNewGood(draft.tempId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-emerald-600">ชื่อเมนูใหม่</label>
                      <Input
                        value={draft.name}
                        onChange={(e) => handleDraftNewGoodChange(draft.tempId, "name", e.target.value)}
                        placeholder="ชื่อเมนูใหม่"
                        className={`h-9 text-sm bg-emerald-50/50 ${
                          fieldErrors?.name ? "border-red-500" : "border-emerald-100"
                        }`}
                        autoFocus
                      />
                      {fieldErrors?.name && <p className="text-xs text-red-500 px-1">{fieldErrors.name}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-emerald-600">ราคา</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/70 text-sm">฿</span>
                        <Input
                          value={draft.price}
                          onChange={(e) => handleDraftNewGoodChange(draft.tempId, "price", e.target.value)}
                          placeholder="0"
                          inputMode="decimal"
                          className={`h-9 pl-7 text-sm font-semibold text-emerald-700 bg-emerald-50/50 ${
                            fieldErrors?.price ? "border-red-500" : "border-emerald-100"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex gap-1 pt-1 mt-auto">
                        <Button
                            onClick={(e) => handleSaveAllGoods(e as any)}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-md rounded-full px-6"
                            disabled={savingAllGoods || loadingGoods}
                        >
                            {savingAllGoods ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                            </>
                            ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                บันทึกการแก้ไข
                            </>
                            )}
                        </Button>
                    </div>
                    {fieldErrors?.price && <p className="text-xs text-red-500 px-1">{fieldErrors.price}</p>}
                    {rowError && <p className="text-xs text-red-500 px-1 mt-1">{rowError}</p>}
                  </CardContent>
                

                </Card>
              )
            })}

            {/* Add Button Card */}
            <button
              type="button"
              onClick={handleAddDraftNewGood}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 aspect-[3/4] hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-200">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-700">เพิ่มเมนูใหม่</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
