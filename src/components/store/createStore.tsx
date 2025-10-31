import { RegistrationForm } from "@/components/registration-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header Section */}
      <header className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-emerald-800 mb-2">Kaset Fair 2024</h1>
              <p className="text-xl text-emerald-600 mb-1">Student Zone Registration</p>
              <p className="text-gray-600">Join Thailand's premier agricultural innovation showcase</p>
            </div>
            {/* <Link href="/login">
              <Button
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
            <h2 className="text-2xl font-semibold text-white mb-2">Register for Student Zone</h2>
            <p className="text-emerald-100">Secure your spot at the most exciting Kaset Fair 2026 in Thailand</p>
          </div>

          <div className="p-8">
            <RegistrationForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-800 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-emerald-200">
            © 2026 Kaset Fair. Empowering the future of agriculture through innovation.
          </p>
        </div>
      </footer>
    </div>
  )
}
