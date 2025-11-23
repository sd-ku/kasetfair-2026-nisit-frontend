"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn, useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, Shield } from "lucide-react"
import { exchangeWithGoogleIdToken } from "@/services/authService"
import { loginWithKU } from "@/services/authService"

// --- utils ---
const hasAppToken = () =>
  typeof document !== "undefined" && /(?:^|;\s*)access_token=/.test(document.cookie)

const isSafeCallback = (raw: string | null) => {
  if (!raw) return false
  try {
    const u = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost")
    // กัน open redirect: ต้องเป็น path ภายในเว็บเท่านั้น
    return u.origin === window.location.origin
  } catch {
    return false
  }
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { status, data } = useSession()

  const [isLoading, setIsLoading] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const exchangingRef = useRef(false) // กันยิง exchange ซ้ำ

  const error = params.get("error")
  const reason = params.get("reason")
  const callbackUrlParam = params.get("callbackUrl")
  const callbackUrl =
    isSafeCallback(callbackUrlParam) ? callbackUrlParam! : "/"

  // 1) ถ้า NextAuth ยัง authenticated แต่แอปไม่มี access_token → เคลียร์ session NextAuth ให้กด Google ใหม่ได้
  useEffect(() => {
    const run = async () => {
      if (status === "authenticated" && !hasAppToken()) {
        if (cleaning) return
        setCleaning(true)
        setErrMsg(null)
        await signOut({ redirect: false }) // ลบ next-auth.session-token
        setCleaning(false)
      }
    }
    run()
  }, [status, cleaning])

  // 2) หลัง sign-in สำเร็จ NextAuth จะใส่ id_token ลงใน session (คุณต้องผูกใน callbacks.jwt มาก่อน)
  useEffect(() => {
    const exchange = async () => {
      if (status !== "authenticated" || !data) return
      // กันยิงซ้ำ
      if (exchangingRef.current) return
      const idToken = (data as any)?.id_token
      if (!idToken) return

      exchangingRef.current = true
      setErrMsg(null)
      try {
        const result = await exchangeWithGoogleIdToken(idToken)
        // Nest ต้อง set-cookie access_token (httpOnly) กลับมา (credentials: 'include')
        if (result?.user?.profileComplete === false) {
          router.replace("/register")
        } else {
          router.replace(callbackUrl || "/home")
        }
      } catch (e: any) {
        // ล้มเหลว → กลับหน้า login พร้อมข้อความ และเคลียร์ session เผื่อ token ตกค้าง
        await signOut({ redirect: false })
        setErrMsg(typeof e?.message === "string" ? e.message : "Sign-in failed, please try again.")
      } finally {
        exchangingRef.current = false
      }
    }
    exchange()
  }, [data, status, router, callbackUrl])

  const handleGoogle = async () => {
    setErrMsg(null)
    setIsLoading(true)
    try {
      // ให้ NextAuth redirect เอง → โค้ดหลังจากนี้ปกติจะไม่รันถ้า redirect
      await signIn("google", { callbackUrl: "/login" })
    } finally {
      setIsLoading(false)
    }
  }

  // 3) ปรับ UX: ถ้ามาจาก reason=expired ให้แจ้งชัด ๆ
  const banner =
    errMsg
      ? errMsg
      : error === "OAuthAccountNotLinked"
        ? "อีเมลนี้เคยสมัครด้วยผู้ให้บริการอื่นไว้ กรุณาใช้วิธีเดิมที่เคยสมัคร"
        : reason === "expired"
          ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
          : null

  return (
    <>
      {banner && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">{banner}</p>
        </div>
      )}

      {/* KU All Login – ขึ้นมาเป็นปุ่มหลักแทน Google */}
      <Button
        type="button"
        onClick={() => loginWithKU()}
        disabled={isLoading || cleaning}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isLoading || cleaning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {cleaning ? "Clearing session..." : "Signing in with KU All Login..."}
          </>
        ) : (
          <>
            Continue with KU All Login
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {/* <div className="mt-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>
      </div> */}

      <Button
        type="button"
        onClick={handleGoogle}
        disabled={isLoading || cleaning || (status === "authenticated" && !hasAppToken())}
        variant="outline"
        className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
      >
        {isLoading || cleaning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {cleaning ? "Clearing session..." : "Signing in with Google..."}
          </>
        ) : (
          <>
            Continue with Google
          </>
        )}
      </Button>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">Welcome to KasetFair2026</h1>
          <p className="text-emerald-600">Sign in to access your Kaset Fair account</p>
        </div>

        <Card className="border-emerald-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-800">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
