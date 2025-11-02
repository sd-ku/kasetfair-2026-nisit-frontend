"use client"

import { useEffect, useState } from "react"
import { redirect, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nisitId: "",
    phone: "",
    nisitCardLink: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const Debug = () => (
    <pre className="text-xs bg-black/80 text-green-300 p-3 rounded mt-4 overflow-auto">
      {JSON.stringify(
        { status, session: { profileComplete: (session as any)?.profileComplete, missing: (session as any)?.missing } },
        null,
        2
      )}
    </pre>
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated") {
      if (session?.profileComplete === true) {
        router.replace("/home");
      }
    }
  }, [status, session, router]);

  if (status !== "authenticated") {
    return <div />
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // TODO: call API
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">Create Account</h1>
          <p className="text-emerald-600">Join the Kaset Fair</p>
        </div>
        <Card className="border-emerald-200 shadow-lg">
          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {/* <div className="flex gap-4"> */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="firstname">ชื่อ</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="ชื่อ"
                  autoComplete="given-name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex-1 space-y-2">
                <Label htmlFor="lastname">นามสกุล</Label>
                <Input
                  id="lastname"
                  name="lastname"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="นามสกุล"
                  autoComplete="family-name"
                  required
                  disabled={isLoading}
                />
              </div>
              {/* </div> */}
              <div className="space-y-2">
                <Label htmlFor="nisitId">รหัสนิสิต</Label>
                <Input
                  id="nisitId"
                  name="nisitId"
                  value={formData.nisitId}
                  onChange={handleInputChange}
                  placeholder=""
                  autoComplete="student-id"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทร</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="08x-xxx-xxxx"
                  autoComplete="tel"
                  required
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create account"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        {/* <Debug /> */}
      </div>
    </div>
  )
}
