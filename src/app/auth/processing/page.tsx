"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * หน้านี้ใช้เป็น callback endpoint หลังจาก backend ทำ KU login สำเร็จ
 * Backend จะ:
 * 1. Set cookie access_token (httpOnly)
 * 2. Redirect มาที่หน้านี้พร้อม query params (success/error)
 * 3. Frontend จะตรวจสอบ cookie และ redirect ต่อไปยังหน้าที่เหมาะสม
 */
function AuthProcessingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
    const [message, setMessage] = useState("กำลังตรวจสอบข้อมูลการเข้าสู่ระบบ...")

    useEffect(() => {
        const processAuth = async () => {
            // ตรวจสอบว่ามี access_token ใน cookie หรือไม่
            const hasToken = document.cookie.includes("access_token=")

            // ดึง query parameters
            const error = searchParams.get("error")
            const profileComplete = searchParams.get("profileComplete")
            const callbackUrl = searchParams.get("callbackUrl") || "/"

            // ถ้ามี error จาก backend
            if (error) {
                setStatus("error")
                setMessage(decodeURIComponent(error))

                // รอ 2 วินาที แล้ว redirect กลับไป login
                setTimeout(() => {
                    router.replace("/login")
                }, 2000)
                return
            }

            // ถ้าไม่มี token ใน cookie
            if (!hasToken) {
                setStatus("error")
                setMessage("ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง")

                setTimeout(() => {
                    router.replace("/login")
                }, 2000)
                return
            }

            // มี token แล้ว → ตรวจสอบว่า profile complete หรือยัง
            setStatus("success")
            setMessage("เข้าสู่ระบบสำเร็จ กำลังนำคุณไปยังหน้าถัดไป...")

            setTimeout(() => {
                if (profileComplete === "false") {
                    router.replace("/register")
                } else {
                    router.replace(callbackUrl)
                }
            }, 1000)
        }

        processAuth()
    }, [router, searchParams])

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-emerald-200 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-2xl text-gray-800">
                        {status === "processing" && "กำลังดำเนินการ..."}
                        {status === "success" && "สำเร็จ!"}
                        {status === "error" && "เกิดข้อผิดพลาด"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    {status === "processing" && (
                        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                    )}
                    {status === "success" && (
                        <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                    )}
                    {status === "error" && (
                        <XCircle className="w-16 h-16 text-red-600" />
                    )}

                    <p className="text-center text-gray-600">{message}</p>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AuthProcessingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-emerald-200 shadow-lg">
                    <CardContent className="flex flex-col items-center space-y-4 py-8">
                        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                        <p className="text-center text-gray-600">กำลังโหลด...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <AuthProcessingContent />
        </Suspense>
    )
}
