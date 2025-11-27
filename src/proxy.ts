import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify, decodeJwt, type JWTPayload } from "jose"

const PUBLIC_WHEN_UNAUTH = ["/login", "/auth/processing", "/_health"]
const BLOCK_WHEN_AUTH = ["/login", "/register", "/auth/processing"]
const STATIC_PREFIXES = ["/_next", "/assets", "/favicon.ico", "/layoutStore.png"];
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

/** กัน redirect loop เวลาอยู่หน้า /login อยู่แล้ว */
function buildLoginRedirectSafe(url: URL) {
  if (url.pathname === "/login") return null // อย่า redirect ซ้ำ
  const target = new URL(url)
  target.pathname = "/login"
  target.search = ""

  // อย่าใส่ callbackUrl เป็น /login ซ้ำ ๆ
  const cb = url.pathname === "/login" ? "/" : (url.pathname + url.search)
  target.searchParams.set("callbackUrl", cb)
  return target
}

/** ลบคุกกี้ token ที่เสีย/หมดอายุทิ้งทันที */
function clearAccessCookie(res: NextResponse) {
  res.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    expires: new Date(0),
  })
}

function shouldBypassProxy(path: string, method: string) {
  if (STATIC_PATHS.has(path) || isPathStartsWith(path, STATIC_PREFIXES)) return true
  if (path.startsWith("/api/auth")) return true
  if (path === "/_health") return true
  if (method === "OPTIONS" || method === "HEAD") return true
  return false
}

/** เช็ค exp แบบเร็ว ๆ โดยไม่ verify เพื่อตัด loop ก่อน */
function isExpiredFast(token: string): boolean {
  try {
    const payload = decodeJwt(token) as JWTPayload
    if (!payload.exp) return false
    return (Date.now() / 1000) > payload.exp
  } catch {
    return false
  }
}

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const path = url.pathname
  const method = req.method

  if (shouldBypassProxy(path, req.method)) {
    return NextResponse.next()
  }

  const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const cookieToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const rawAuth = cookieToken || bearerToken

  const isApi = path.startsWith("/api/")

  // ไม่มี token → ปล่อย public หรือส่งไป /login แบบไม่ loop
  if (!rawAuth) {
    if (isPathStartsWith(path, PUBLIC_WHEN_UNAUTH)) {
      return NextResponse.next()
    }
    const target = buildLoginRedirectSafe(url)
    if (target) return NextResponse.redirect(target)
    return NextResponse.next()
  }

  // กัน loop: ถ้าหมดอายุชัด ๆ ให้ลบคุกกี้ก่อน แล้วค่อยส่งไป /login
  if (isExpiredFast(rawAuth)) {
    const target = buildLoginRedirectSafe(url)
    const res = target ? NextResponse.redirect(target) : NextResponse.next()
    clearAccessCookie(res)
    return res
  }

  // verify เต็ม (จะเช็ค exp/nbf ให้อยู่แล้ว)
  let payload: AppJWTPayload | null = null
  try {
    payload = await verifyAppToken(rawAuth)
  } catch {
    const target = buildLoginRedirectSafe(url)
    const res = target ? NextResponse.redirect(target) : NextResponse.next()
    clearAccessCookie(res) // สำคัญ: ลบทิ้งกันเด้งกลับไปกลับมา
    return res
  }

  // console.log(payload)

  // ถ้า profile ยังไม่ complete
  const requiredFields = ["firstName", "lastName", "email", "nisitId", "phone"];
  const profileIncomplete =
    !payload ||
    requiredFields.some((key) => !payload[key as keyof typeof payload]) ||
    !payload.profileComplete;

  if (profileIncomplete) {
    if (!isApi) {
      const allowedPage =
        path.startsWith("/register") || path.startsWith("/auth/processing");

      if (!allowedPage) {
        const target = url.clone();
        target.pathname = "/register";
        target.search = "";
        if (target.href !== url.href) return NextResponse.redirect(target);
      }
    }

    return NextResponse.next();
  }

  // บล็อคหน้าที่ไม่ควรเข้าเมื่อ auth แล้ว
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
