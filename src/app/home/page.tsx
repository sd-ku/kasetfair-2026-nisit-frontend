"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md">
        <h1 className="text-2xl font-semibold text-emerald-700 mb-2">Welcome 👋</h1>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
