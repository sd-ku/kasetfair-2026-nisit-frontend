import { NextResponse, type NextRequest, type NextURL } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"

const PUBLIC_WHEN_UNAUTH = ["/login", "/auth/processing", "/_health"]
const BLOCK_WHEN_AUTH = ["/login", "/register", "/auth/processing"]
const STATIC_PREFIXES = ["/_next", "/assets"]
const STATIC_PATHS = new Set(["/favicon.ico"])
const ACCESS_TOKEN_COOKIE = "access_token"

const secret = process.env.JWT_SECRET
if (!secret) throw new Error("JWT_SECRET is not set")
const HMAC_KEY = new TextEncoder().encode(secret)

type AppJWTPayload = JWTPayload & {
  profileComplete?: boolean
  email?: string
  sub?: string
}

async function verifyAppToken(token: string): Promise<AppJWTPayload> {
  const { payload } = await jwtVerify(token, HMAC_KEY)
  return payload as AppJWTPayload
}

function isPathStartsWith(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path.startsWith(prefix))
}

function buildLoginRedirect(url: NextURL) {
  const target = url.clone()
  target.pathname = "/login"
  target.search = ""
  target.searchParams.set("callbackUrl", url.pathname + url.search)
  return target
}

function shouldBypassProxy(path: string, method: string) {
  if (STATIC_PATHS.has(path) || isPathStartsWith(path, STATIC_PREFIXES)) return true
  if (path.startsWith("/api/auth")) return true
  if (path === "/_health") return true
  if (method === "OPTIONS" || method === "HEAD") return true
  return false
}

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const path = url.pathname

  if (shouldBypassProxy(path, req.method)) {
    return NextResponse.next()
  }

  const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const cookieToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const rawAuth = cookieToken || bearerToken

  if (!rawAuth) {
    if (isPathStartsWith(path, PUBLIC_WHEN_UNAUTH)) {
      return NextResponse.next()
    }
    const target = buildLoginRedirect(url)
    if (target.href !== url.href) return NextResponse.redirect(target)
    return NextResponse.next()
  }

  let payload: AppJWTPayload | null = null
  try {
    payload = await verifyAppToken(rawAuth)
  } catch {
    const target = buildLoginRedirect(url)
    if (target.href !== url.href) return NextResponse.redirect(target)
    return NextResponse.next()
  }

  const isProfileComplete = Boolean(payload?.profileComplete)

  if (!isProfileComplete) {
    const allowed = path.startsWith("/register") || path.startsWith("/auth/processing")
    if (!allowed) {
      const target = url.clone()
      target.pathname = "/register"
      target.search = ""
      if (target.href !== url.href) return NextResponse.redirect(target)
    }
    return NextResponse.next()
  }

  if (isPathStartsWith(path, BLOCK_WHEN_AUTH)) {
    const target = url.clone()
    target.pathname = "/"
    target.search = ""
    if (target.href !== url.href) return NextResponse.redirect(target)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
