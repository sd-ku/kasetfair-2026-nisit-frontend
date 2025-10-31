"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, Shield } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const { status } = useSession()
  const params = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.push("")
      router.refresh()
    }
  }, [status, router])

  const error = params.get("error")

  const handleGoogle = async () => {
    try {
      setIsLoading(true)
      await signIn("google", { callbackUrl: params.get("callbackUrl") ?? "" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">
            {error === "OAuthAccountNotLinked"
              ? "อีเมลนี้เคยสมัครด้วยผู้ให้บริการอื่นไว้ กรุณาใช้วิธีเดิมที่เคยสมัคร"
              : `Sign in error: ${error}`}
          </p>
        </div>
      )}

      <Button
        onClick={handleGoogle}
        disabled={isLoading || status === "authenticated"}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in with Google...
          </>
        ) : (
          <>
            Continue with Google
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <Link href="/admin/login">
          <Button
            variant="outline"
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin Login
          </Button>
        </Link>
      </div>

      {/* <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Need an account?{" "}
          <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Sign up here
          </Link>
        </p>
      </div> */}
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

        {/* <div className="mt-6 text-center">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm">
            ← Back to Registration
          </Link>
        </div> */}
      </div>
    </div>
  )
}
