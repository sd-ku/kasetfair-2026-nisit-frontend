"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

type Product = {
  id: string
  name: string
  price: string
  fileName: string | null
}

type StepThreeFormProps = {
  products: Product[]
  isStoreAdmin: boolean
  storeAdminNisitId?: string | null
  onProductChange: (id: string, field: "name" | "price", value: string) => void
  onProductFileChange: (id: string, file: File | null) => void
  onAddProduct: () => void
  onRemoveProduct: (id: string) => void
  onBack: () => void
  onNext: () => Promise<void> | void
  saving: boolean
}

export function StepThreeForm({
  products,
  isStoreAdmin,
  storeAdminNisitId,
  onProductChange,
  onProductFileChange,
  onAddProduct,
  onRemoveProduct,
  onBack,
  onNext,
  saving,
}: StepThreeFormProps) {
  void onProductFileChange

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onNext()
  }

  const readOnly = !isStoreAdmin

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-800">รายการสินค้า</CardTitle>
        {readOnly && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You can view this data but only the store admin can edit.
            {storeAdminNisitId ? (
              <span className="ml-2 text-xs text-amber-900">Admin: {storeAdminNisitId}</span>
            ) : null}
          </div>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3 text-sm text-gray-600">
            <span>ชื่อสินค้า</span>
            <span>ราคา</span>
            <span className="sr-only">actions</span>
          </div>

          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3"
              >
                <Input
                  placeholder="ชื่อสินค้า"
                  value={product.name}
                  onChange={(e) => onProductChange(product.id, "name", e.target.value)}
                  required
                  disabled={readOnly}
                />

                <Input
                  placeholder="ราคา"
                  value={product.price}
                  onChange={(e) => onProductChange(product.id, "price", e.target.value)}
                  inputMode="decimal"
                  className="text-right"
                  required
                  disabled={readOnly}
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => onRemoveProduct(product.id)}
                  disabled={products.length === 1 || readOnly}
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
            onClick={onAddProduct}
            disabled={readOnly}
          >
            <Plus className="h-4 w-4" />
            เพิ่มสินค้า
          </Button>
        </CardContent>

        <CardFooter className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={onBack}
          >
            ย้อนกลับ
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={saving || readOnly}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
