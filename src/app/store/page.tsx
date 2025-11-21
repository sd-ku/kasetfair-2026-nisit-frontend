"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Store, ShoppingBag, FileImage, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStoreStatus } from "@/services/storeServices"
import type { StoreResponseDto } from "@/services/dto/store-info.dto"

export default function StoreDashboardPage() {
  const router = useRouter()
  const [store, setStore] = useState<StoreResponseDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const data = await getStoreStatus()
        setStore(data)
      } catch (error) {
        console.error("Failed to fetch store info", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [])

  const menuItems = [
    {
      title: "ข้อมูลร้านค้า",
      description: "จัดการชื่อร้าน สมาชิก และข้อมูลพื้นฐาน",
      icon: Store,
      href: "/store/info",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "จัดการสินค้า",
      description: "เพิ่ม ลบ แก้ไขรายการสินค้าและราคา",
      icon: ShoppingBag,
      href: "/store/goods",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "ไฟล์ร้านค้า",
      description: "อัปโหลดรูปโปรโมตและเอกสารร้านค้า",
      icon: FileImage,
      href: "/store/layout",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900">จัดการร้านค้า</h1>
            <p className="mt-2 text-emerald-700">ยินดีต้อนรับสู่ระบบจัดการร้านค้าของคุณ</p>
          </div>
          {store && (
            <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-900">{store.storeName}</p>
                <p className="text-xs text-emerald-600">
                  สถานะ: {store.state} | บูธ: {store.boothNumber || "-"}
                </p>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {store.type}
              </Badge>
            </div>
          )}
        </header>

        <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            return (
              <Card
                key={item.href}
                className="group relative overflow-hidden border-emerald-100 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  router.push(item.href)
                }}
              >
                <CardHeader>
                  <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <CardTitle className="text-xl text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent
                  className="
                    overflow-hidden transition-all duration-300
                    max-h-0 opacity-0 translate-y-2
                    group-hover:max-h-20 group-hover:opacity-100 group-hover:translate-y-0
                  "
                >
                  <div className="flex items-center text-sm font-medium text-emerald-600">
                    ไปที่หน้าจัดการ <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
          )})}
        </div>
      </div>
    </div>
  )
}
