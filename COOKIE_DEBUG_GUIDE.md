# 🔍 วิเคราะห์ปัญหา: Access Token หายไปจาก Cookie

## 📋 สรุปปัญหา

หลังจาก backend ทำ KU All Login สำเร็จและ generate token แล้ว พอ redirect กลับมาหน้า frontend **cookie `access_token` หายไป**

---

## 🔄 Flow การทำงานปัจจุบัน

### 1. Frontend: User กดปุ่ม Login
```typescript
// src/app/login/page.tsx:128
loginWithKU() 
// → window.location.href = `${NEXT_PUBLIC_API_URL}/auth/ku/login`
```

### 2. Backend: OAuth Flow
```
Browser → Backend /auth/ku/login
       → Redirect to KU OAuth
       → KU OAuth callback
       → Backend validates & generates JWT
       → Set-Cookie: access_token=xxx; HttpOnly; Secure; SameSite=Lax
       → Redirect to Frontend
```

### 3. Frontend: Callback (ปัญหาเกิดที่นี่! 🚨)
- **ปัญหา**: Backend redirect กลับมาแต่ cookie หายไป
- **ผลลัพธ์**: Middleware (`src/proxy.ts`) ไม่เจอ token → redirect กลับไป `/login` (loop)

---

## 🐛 สาเหตุที่เป็นไปได้

### 1. ❌ **ไม่มี Callback Page** (ปัญหาหลัก)

**ปัญหา**: 
- `src/proxy.ts` กำหนด `/auth/processing` เป็น public route
- แต่**ไม่มี page component** สำหรับ route นี้!

```typescript
// src/proxy.ts:4
const PUBLIC_WHEN_UNAUTH = ["/login", "/auth/processing", "/_health"]
```

**ผลกระทบ**:
- Backend redirect มาที่ `/auth/processing` แต่ Next.js ไม่มีหน้านี้
- เกิด 404 หรือ redirect loop

**วิธีแก้**: ✅ **สร้างหน้า `/auth/processing`** (ทำแล้ว)

---

### 2. ⚠️ **Cookie Domain/Path ไม่ตรงกัน**

**ตรวจสอบ Backend**:
```typescript
// Backend ต้อง set cookie แบบนี้
res.cookie('access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true ใน production
  sameSite: 'lax', // ไม่ใช่ 'strict'
  path: '/',
  domain: undefined, // หรือ '.yourdomain.com' ถ้า subdomain ต่างกัน
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})
```

**ปัญหาที่พบบ่อย**:
- ❌ `sameSite: 'strict'` → Cookie ไม่ส่งกลับมาเมื่อ redirect จาก external site
- ❌ `domain: 'backend.com'` → Cookie ไม่ทำงานกับ `frontend.com`
- ❌ `secure: true` บน HTTP localhost → Cookie ไม่ทำงาน

---

### 3. ⚠️ **CORS Configuration ผิด**

**ถ้า Backend และ Frontend อยู่คนละ Domain**:

```typescript
// Backend CORS config ต้องเป็น:
app.enableCors({
  origin: process.env.FRONTEND_URL, // ต้องระบุชัดเจน ไม่ใช่ '*'
  credentials: true, // สำคัญมาก!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

**ตรวจสอบ**:
- ✅ `Access-Control-Allow-Credentials: true`
- ✅ `Access-Control-Allow-Origin: https://frontend.com` (ไม่ใช่ `*`)

---

### 4. ⚠️ **Redirect URL ผิด**

**Backend ต้อง redirect ไปที่**:
```typescript
// ✅ ถูกต้อง
const redirectUrl = `${FRONTEND_URL}/auth/processing?profileComplete=${user.profileComplete}`

// ❌ ผิด - redirect ไป /login จะทำให้ middleware บล็อก
const redirectUrl = `${FRONTEND_URL}/login`

// ❌ ผิด - ไม่มี query params ทำให้ frontend ไม่รู้ว่าสำเร็จหรือไม่
const redirectUrl = `${FRONTEND_URL}/auth/processing`
```

---

## ✅ วิธีแก้ไขที่แนะนำ

### 1. **สร้างหน้า `/auth/processing`** ✅ (ทำแล้ว)

ไฟล์: `src/app/auth/processing/page.tsx`

หน้านี้จะ:
- ตรวจสอบว่ามี `access_token` ใน cookie หรือไม่
- อ่าน query params จาก backend (`error`, `profileComplete`, `callbackUrl`)
- Redirect ไปยังหน้าที่เหมาะสม:
  - ถ้า error → `/login`
  - ถ้า profile ไม่ complete → `/register`
  - ถ้าสำเร็จ → `callbackUrl` หรือ `/`

---

### 2. **แก้ไข Backend Redirect URL**

**ไฟล์ Backend**: `src/auth/auth.controller.ts` (หรือที่คล้ายกัน)

```typescript
@Get('ku/callback')
async kuCallback(@Req() req, @Res() res) {
  try {
    // ... validate OAuth response ...
    
    const user = await this.authService.validateKUUser(req.user)
    const token = this.authService.generateToken(user)
    
    // Set cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // สำคัญ!
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    
    // Redirect ไปที่ /auth/processing พร้อม query params
    const frontendUrl = process.env.FRONTEND_URL
    const profileComplete = user.profileComplete ? 'true' : 'false'
    const callbackUrl = req.session?.callbackUrl || '/'
    
    return res.redirect(
      `${frontendUrl}/auth/processing?profileComplete=${profileComplete}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    )
  } catch (error) {
    // ถ้า error ให้ส่ง error message กลับไป
    const errorMsg = encodeURIComponent(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    return res.redirect(`${process.env.FRONTEND_URL}/auth/processing?error=${errorMsg}`)
  }
}
```

---

### 3. **ตรวจสอบ Environment Variables**

**Frontend** (`.env` และ `.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# หรือ
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend** (`.env`):
```bash
FRONTEND_URL=https://yourdomain.com
# หรือ
FRONTEND_URL=http://localhost:3000

# สำหรับ CORS
CORS_ORIGIN=https://yourdomain.com

# สำคัญ: ต้องมี JWT_SECRET เหมือนกับ Frontend
JWT_SECRET=your-secret-key-here
```

---

### 4. **ตรวจสอบ Cookie ใน Browser DevTools**

**วิธีตรวจสอบ**:
1. เปิด DevTools (F12)
2. ไปที่ tab **Application** → **Cookies**
3. ตรวจสอบว่ามี `access_token` หรือไม่

**ถ้าไม่มี Cookie**:
- ตรวจสอบ Network tab → ดู Response Headers จาก backend
- ควรเห็น `Set-Cookie: access_token=...`
- ถ้าไม่เห็น → Backend ไม่ได้ set cookie

**ถ้ามี Cookie แต่ไม่ส่งกลับไป Backend**:
- ตรวจสอบ `SameSite` attribute
- ตรวจสอบ `Secure` flag (ต้องเป็น HTTPS ถ้า secure=true)
- ตรวจสอบ `Domain` และ `Path`

---

## 🧪 วิธีทดสอบ

### 1. **ทดสอบ Local (HTTP)**

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev

# Backend ต้องตั้งค่า
secure: false  # เพราะเป็น HTTP
sameSite: 'lax'
```

### 2. **ทดสอบ Production (HTTPS)**

```bash
# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com npm run build && npm start

# Backend ต้องตั้งค่า
secure: true  # เพราะเป็น HTTPS
sameSite: 'lax'
```

### 3. **ตรวจสอบ Cookie Flow**

1. กด Login → ดู Network tab
2. ควรเห็น:
   ```
   Request: GET /auth/ku/login
   Response: 302 Redirect to KU OAuth
   
   Request: GET /auth/ku/callback (from KU)
   Response: 302 Redirect to /auth/processing
   Headers: Set-Cookie: access_token=...
   
   Request: GET /auth/processing
   Headers: Cookie: access_token=...  ← ต้องมี!
   ```

---

## 📝 Checklist การแก้ไข

- [x] สร้างหน้า `/auth/processing` ✅
- [ ] แก้ Backend redirect URL ให้ไปที่ `/auth/processing`
- [ ] ตรวจสอบ Backend cookie settings:
  - [ ] `httpOnly: true`
  - [ ] `secure: true` (production only)
  - [ ] `sameSite: 'lax'` (ไม่ใช่ 'strict')
  - [ ] `path: '/'`
  - [ ] `domain: undefined` (หรือตั้งค่าให้ถูกต้อง)
- [ ] ตรวจสอบ CORS configuration:
  - [ ] `credentials: true`
  - [ ] `origin: <frontend-url>` (ไม่ใช่ '*')
- [ ] ตรวจสอบ Environment Variables
- [ ] ทดสอบ Cookie flow ใน DevTools

---

## 🔧 Debug Commands

```bash
# ดู cookie ใน terminal (Linux/Mac)
curl -v http://localhost:3001/auth/ku/callback

# ดู cookie ใน PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:3001/auth/ku/callback" -Method GET -UseBasicParsing | Select-Object -ExpandProperty Headers

# ทดสอบ CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     http://localhost:3001/auth/ku/login
```

---

## 📚 อ้างอิง

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
