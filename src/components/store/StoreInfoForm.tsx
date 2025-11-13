"use client"

import { FormEvent, useEffect, useId, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GoodsType } from "@/services/dto/goods.dto"
import { Plus, Trash2, UploadCloud } from "lucide-react"

export type StoreInfoFormProduct = {
  id: string | null
  name: string
  price: number | null
  type: GoodsType
  mediaId: string | null
  mediaFileName: string | null
}

export type StoreInfoFormInitialValues = {
  storeName?: string
  description?: string
  boothMediaId?: string | null
  boothLayoutFileName?: string | null
  products?: StoreInfoFormProduct[]
}

export type StoreInfoFormFieldErrors = Record<string, string>

export type StoreInfoFormSubmitPayload = {
  storeName: string
  description: string
  boothMediaId: string | null
  layoutFile: File | null
  products: Array<{
    id: string | null
    name: string
    price: string
    type: GoodsType
    mediaId: string | null
    file: File | null
  }>
}

type StoreInfoFormProps = {
  typeLabel: string
  initialValues?: StoreInfoFormInitialValues
  fieldErrors?: StoreInfoFormFieldErrors
  generalError?: string | null
  submitting?: boolean
  disabledReason?: string | null
  onSubmit: (payload: StoreInfoFormSubmitPayload) => Promise<void> | void
}

type ProductFormState = {
  clientId: string
  id: string | null
  name: string
  price: string
  type: GoodsType
  mediaId: string | null
  mediaFileName: string | null
  file: File | null
}

const generateClientId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `product-${Math.random().toString(16).slice(2)}`

const formatPrice = (price?: number | null) => {
  if (price == null) return ""
  if (Number.isNaN(price)) return ""
  return Number.isInteger(price) ? String(price) : price.toString()
}

const mapInitialProducts = (products?: StoreInfoFormProduct[]): ProductFormState[] => {
  if (!Array.isArray(products) || !products.length) {
    return [
      {
        clientId: generateClientId(),
        id: null,
        name: "",
        price: "",
        type: "Food",
        mediaId: null,
        mediaFileName: null,
        file: null,
      },
    ]
  }

  return products.map((product) => ({
    clientId: generateClientId(),
    id: product.id ?? null,
    name: product.name ?? "",
    price: formatPrice(product.price),
    type: product.type ?? "Food",
    mediaId: product.mediaId ?? null,
    mediaFileName: product.mediaFileName ?? null,
    file: null,
  }))
}

export function StoreInfoForm({
  typeLabel,
  initialValues,
  fieldErrors,
  generalError = null,
  submitting = false,
  disabledReason = null,
  onSubmit,
}: StoreInfoFormProps) {
  const fileInputId = useId()

  const [storeName, setStoreName] = useState(initialValues?.storeName ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [boothMediaId, setBoothMediaId] = useState(initialValues?.boothMediaId ?? null)
  const [layoutFileName, setLayoutFileName] = useState(initialValues?.boothLayoutFileName ?? null)
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [products, setProducts] = useState<ProductFormState[]>(() =>
    mapInitialProducts(initialValues?.products)
  )

  useEffect(() => {
    setStoreName(initialValues?.storeName ?? "")
    setDescription(initialValues?.description ?? "")
    setBoothMediaId(initialValues?.boothMediaId ?? null)
    setLayoutFileName(initialValues?.boothLayoutFileName ?? null)
    setLayoutFile(null)
    setProducts(mapInitialProducts(initialValues?.products))
  }, [initialValues])

  const handleProductChange = (clientId: string, key: "name" | "price" | "type", value: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.clientId === clientId
          ? {
              ...product,
              [key]: value,
            }
          : product
      )
    )
  }

  const handleProductFileChange = (clientId: string, file: File | null) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.clientId === clientId
          ? {
              ...product,
              file,
              mediaFileName: file ? file.name : product.mediaFileName,
            }
          : product
      )
    )
  }

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        clientId: generateClientId(),
        id: null,
        name: "",
        price: "",
        type: "Food",
        mediaId: null,
        mediaFileName: null,
        file: null,
      },
    ])
  }

  const removeProduct = (clientId: string) => {
    setProducts((prev) => (prev.length > 1 ? prev.filter((p) => p.clientId !== clientId) : prev))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({
      storeName,
      description,
      boothMediaId,
      layoutFile,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        type: product.type,
        mediaId: product.mediaId,
        file: product.file,
      })),
    })
  }

  const getError = (...keys: string[]) => {
    if (!fieldErrors) return null
    for (const key of keys) {
      if (fieldErrors[key]) return fieldErrors[key]
    }
    return null
  }

  const submitDisabled = submitting || Boolean(disabledReason)

  const productsError = getError("goods", "products")

  const headerDescription = useMemo(() => {
    if (disabledReason) return disabledReason
    return "กรอกข้อมูลร้านให้ครบถ้วน รวมถึงรายละเอียดสินค้าและไฟล์ผังบูธก่อนกดยื่นตรวจสอบ"
  }, [disabledReason])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-emerald-100 bg-white/95 shadow-2xl">
        <CardHeader className="border-b border-emerald-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                {typeLabel}
              </p>
              <CardTitle className="text-2xl text-emerald-900">ข้อมูลร้านค้า</CardTitle>
              <p className="mt-1 text-sm text-emerald-700">{headerDescription}</p>
            </div>
            <div className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-800">
              ขั้นตอนสุดท้าย
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {generalError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <section className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">ชื่อร้าน</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                placeholder="ตัวอย่าง: Ku Delight Café"
                required
              />
              {getError("storeName") && (
                <p className="text-sm text-red-600">{getError("storeName")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription">รายละเอียดร้าน (แนะนำสินค้า จุดเด่น ฯลฯ)</Label>
              <Textarea
                id="storeDescription"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="บอกเล่าแนวคิด จุดเด่น เมนูแนะนำ หรือประสบการณ์ที่ผู้ร่วมงานจะได้รับ"
                required
              />
              {getError("description", "storeDescription") && (
                <p className="text-sm text-red-600">
                  {getError("description", "storeDescription")}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-2">
              <Label>ตัวอย่างผังบูธ</Label>
              <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/60 shadow-inner">
                <Image
                  src="/layoutStore.png"
                  alt="ตัวอย่างผังร้าน"
                  width={600}
                  height={640}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={fileInputId}>อัปโหลดผังบูธของคุณ (PDF / PNG / JPG)</Label>
              <label
                htmlFor={fileInputId}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-100"
              >
                <span className="truncate">
                  {layoutFile?.name ?? layoutFileName ?? "เลือกไฟล์ (สูงสุด 10 MB)"}
                </span>
                <UploadCloud className="h-4 w-4" />
              </label>
              <Input
                id={fileInputId}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setLayoutFile(file)
                  if (file) {
                    setLayoutFileName(file.name)
                  }
                }}
              />
              <p className="text-xs text-emerald-600">
                ควรเห็นตำแหน่งสินค้า เคาน์เตอร์ และพื้นที่เตรียมอาหารอย่างชัดเจน
              </p>
              {getError("boothMediaId", "layoutFile") && (
                <p className="text-sm text-red-600">
                  {getError("boothMediaId", "layoutFile")}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">รายการสินค้า</Label>
                <p className="text-sm text-emerald-700">
                  เพิ่มสินค้าอย่างน้อย 1 รายการ พร้อมระบุประเภทและราคาขายจริง
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={addProduct}
              >
                <Plus className="h-4 w-4" />
                เพิ่มสินค้า
              </Button>
            </div>

            {productsError && (
              <p className="text-sm text-red-600">{productsError}</p>
            )}

            <div className="space-y-4">
              {products.map((product, index) => {
                const nameError = getError(`goods[${index}].name`, `products[${index}].name`)
                const priceError = getError(`goods[${index}].price`, `products[${index}].price`)

                return (
                  <div
                    key={product.clientId}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-emerald-900">สินค้า #{index + 1}</p>
                        <p className="text-xs text-emerald-700">ระบุชื่อ ประเภท และราคาให้ครบถ้วน</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => removeProduct(product.clientId)}
                        disabled={products.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">ลบสินค้า</span>
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`product-name-${product.clientId}`}>ชื่อสินค้า</Label>
                        <Input
                          id={`product-name-${product.clientId}`}
                          value={product.name}
                          onChange={(event) =>
                            handleProductChange(product.clientId, "name", event.target.value)
                          }
                          placeholder="เช่น ชาเขียวมะลิ"
                          required
                        />
                        {nameError && <p className="text-sm text-red-600">{nameError}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`product-type-${product.clientId}`}>ประเภทสินค้า</Label>
                        <Select
                          value={product.type}
                          onValueChange={(value: GoodsType) =>
                            handleProductChange(product.clientId, "type", value)
                          }
                        >
                          <SelectTrigger id={`product-type-${product.clientId}`}>
                            <SelectValue placeholder="เลือกประเภท" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Food">อาหาร / เครื่องดื่ม</SelectItem>
                            <SelectItem value="NonFood">สินค้าที่ไม่ใช่อาหาร</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`product-price-${product.clientId}`}>ราคาขาย (บาท)</Label>
                        <Input
                          id={`product-price-${product.clientId}`}
                          value={product.price}
                          onChange={(event) =>
                            handleProductChange(product.clientId, "price", event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="เช่น 79"
                          required
                        />
                        {priceError && <p className="text-sm text-red-600">{priceError}</p>}
                      </div>

              <div className="space-y-2">
                <Label htmlFor={`product-file-${product.clientId}`}>
                  รูปสินค้า (ไม่บังคับ)
                </Label>
                        <label
                          htmlFor={`product-file-${product.clientId}`}
                          className="flex h-10 cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 px-3 text-sm text-emerald-700 hover:bg-emerald-50"
                        >
                          <span className="truncate">
                            {product.file?.name ?? product.mediaFileName ?? "แนบรูป"}
                          </span>
                          <UploadCloud className="h-4 w-4" />
                        </label>
                <Input
                  id={`product-file-${product.clientId}`}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(event) =>
                    handleProductFileChange(product.clientId, event.target.files?.[0] ?? null)
                  }
                />
                {getError(`goods[${index}].image`, `products[${index}].image`) && (
                  <p className="text-sm text-red-600">
                    {getError(`goods[${index}].image`, `products[${index}].image`)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
            </div>
          </section>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 bg-emerald-50/60 px-6 py-4">
          {disabledReason && (
            <p className="text-sm font-medium text-amber-700">{disabledReason}</p>
          )}
          <Button
            type="submit"
            className="min-w-[220px] bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={submitDisabled}
          >
            {submitting ? "กำลังส่งคำขอ..." : "ยื่นตรวจสอบร้านค้า"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
