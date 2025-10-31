import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PREFIXES = ["/login", "/api/auth", "/api/public"]

export async function middleware(req: NextRequest) {
  console.log("Middleware running for:", req.nextUrl.pathname)
  const { pathname } = req.nextUrl

  // ปล่อยไฟล์ static (png, css, js, woff ฯลฯ)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return NextResponse.next()

  // ปล่อย path สาธารณะ
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ต้องมี secret เดียวกับ NextAuth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (token) return NextResponse.next()

  // ไม่มี session → เด้งไป login พร้อม callbackUrl
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  // matcher: ["/:path*"]
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
