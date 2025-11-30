"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Store,
  ShoppingBag,
  FileImage,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Users // เพิ่ม Icon สำหรับชมรม
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getStoreValidate } from "@/services/storeServices"
import { Badge } from "@/components/ui/badge"

// --- Types ---
type StoreType = "Nisit" | "Club"
type StoreState = string

type StoreValidateResponseDto = {
  store: {
    id: number
    storeName: string
    type: StoreType
    state: StoreState
    boothNumber: string
    storeAdminNisitId: string | null
  }
  isValid: boolean
  sections: {
    key: "members" | "clubInfo" | "storeDetail" | "goods"
    label: string
    ok: boolean
    items: {
      key: string
      label: string
      ok: boolean
      message?: string
    }[]
  }[]
}

export default function StoreDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<StoreValidateResponseDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await getStoreValidate()
        setData(response)
      } catch (error) {
        console.error("Failed to fetch store info", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [])

  const getRouteForSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "members":
        return "/store/info"
      case "clubInfo":
        return "/store/club-info"
      case "storeDetail":
        return "/store/layout"
      case "goods":
        return "/store/goods"
      default:
        return "/store"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const store = data?.store

  // --- Menu Items Configuration ---
  const menuItems = [
    {
      title: "ข้อมูลร้านค้า",
      description: "จัดการสมาชิก และข้อมูลพื้นฐาน",
      icon: Store,
      href: "/store/info",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    // --- ส่วนที่เพิ่ม: แสดงเฉพาะ Club ---
    ...(store?.type === "Club" ? [{
      title: "ข้อมูลชมรม",
      description: "แก้ไขรายละเอียดและข้อมูลของชมรม",
      icon: Users,
      href: "/store/club-info",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    }] : []),
    // --------------------------------
    {
      title: "จัดการสินค้า",
      description: "เพิ่ม ลบ แก้ไขรายการสินค้าและราคา",
      icon: ShoppingBag,
      href: "/store/goods",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "รายละเอียด",
      description: "รายละเอียดร้านค้าและรูปการจัดการร้าน",
      icon: FileImage,
      href: "/store/layout",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-10">
      {/* ใช้ max-w-5xl เท่าเดิม */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">

        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 px-6 py-5 shadow-lg ring-1 ring-emerald-100 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => router.push("/home")}
            >
              <ArrowLeft />
            </Button>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-emerald-900 leading-tight">
                จัดการร้านค้า
              </h1>
              <p className="mt-1 text-emerald-700 text-[15px]">
                ยินดีต้อนรับสู่ระบบจัดการร้านค้าของคุณ
              </p>
              {store?.storeAdminNisitId && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50/50 px-4 py-3 border border-emerald-100">
                  <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-700 font-medium">
                    Store Admin
                  </Badge>
                  <span className="text-sm font-medium text-emerald-800">{store.storeAdminNisitId}</span>
                  {/* {isStoreAdmin && (
                    <Badge variant="secondary" className="bg-emerald-600 text-white hover:bg-emerald-700">
                      You
                    </Badge>
                  )} */}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- Menu Grid --- */}
        {/* ใช้ Layout เดิม: grid-cols-2 lg:grid-cols-3 */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const requiresAttention = !data?.isValid && data?.sections.some(s =>
              !s.ok && getRouteForSection(s.key) === item.href
            );

            return (
              <Card
                key={item.href}
                className={cn(
                  "group relative overflow-hidden border-emerald-100 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer",
                  requiresAttention && "ring-2 ring-amber-400 ring-offset-2"
                )}
                onClick={() => {
                  router.push(item.href)
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor}`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    {requiresAttention && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    )}
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
            )
          })}
        </div>
      </div>
    </div>
  )
}