import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { RegistrationForm } from "@/components/registration-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // ✅ import ตัว config

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // ไม่มี session → เด้งไป login
  if (!session) {
    redirect("/login")
  }

  // มี session → เด้งไป register
  redirect("/register")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  )
}
