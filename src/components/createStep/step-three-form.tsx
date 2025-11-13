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
  onProductChange: (id: string, field: "name" | "price", value: string) => void
  onProductFileChange: (id: string, file: File | null) => void
  onAddProduct: () => void
  onRemoveProduct: (id: string) => void
  onBack: () => void
  onSubmitAll: () => Promise<boolean>
  onSubmitSuccess?: () => void
  saving: boolean
}

export function StepThreeForm({
  products,
  onProductChange,
  onProductFileChange,
  onAddProduct,
  onRemoveProduct,
  onBack,
  onSubmitAll,
  onSubmitSuccess,
  saving,
}: StepThreeFormProps) {
  const reloadPage = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const shouldShowSuccess = await onSubmitAll()

    if (shouldShowSuccess) {
      if (onSubmitSuccess) {
        onSubmitSuccess()
        return
      }
      reloadPage()
    }
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-800">ข้อมูลสินค้า</CardTitle>
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
                />

                <Input
                  placeholder="บาท"
                  value={product.price}
                  onChange={(e) => onProductChange(product.id, "price", e.target.value)}
                  inputMode="decimal"
                  className="text-right"
                  required
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => onRemoveProduct(product.id)}
                  disabled={products.length === 1}
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
            disabled={saving}
          >
            {saving ? "กำลังบันทึกและตรวจสอบ..." : "บันทึกและส่ง"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
