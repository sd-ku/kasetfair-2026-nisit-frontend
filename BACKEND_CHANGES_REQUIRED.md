# Backend Changes Required for KU Login Cookie Fix

## 🎯 สิ่งที่ต้องแก้ใน Backend

### 1. แก้ไข KU Login Callback Route

**ไฟล์**: `src/auth/auth.controller.ts` (หรือที่คล้ายกัน)

**ก่อนแก้**:
```typescript
@Get('ku/callback')
async kuCallback(@Req() req, @Res() res) {
  // ... validate user ...
  
  res.cookie('access_token', token, { /* ... */ })
  
  // ❌ Redirect ไปที่ /login หรือ / (ผิด!)
  return res.redirect(`${process.env.FRONTEND_URL}/login`)
}
```

**หลังแก้**:
```typescript
@Get('ku/callback')
async kuCallback(@Req() req, @Res() res) {
  try {
    // Validate OAuth response
    const user = await this.authService.validateKUUser(req.user)
    const token = this.authService.generateToken(user)
    
    // Set cookie with correct settings
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // ⚠️ สำคัญ! ไม่ใช่ 'strict'
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    // Get callbackUrl from session or query
    const callbackUrl = req.session?.callbackUrl || req.query.callbackUrl || '/'
    
    // ✅ Redirect ไปที่ /auth/processing พร้อม query params
    const frontendUrl = process.env.FRONTEND_URL
    const profileComplete = user.profileComplete ? 'true' : 'false'
    
    return res.redirect(
      `${frontendUrl}/auth/processing?profileComplete=${profileComplete}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    )
  } catch (error) {
    // ถ้า error ให้ส่ง error message กลับไป
    const errorMsg = encodeURIComponent(
      error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    )
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/processing?error=${errorMsg}`
    )
  }
}
```

---

### 2. แก้ไข KU Login Route (เก็บ callbackUrl)

**ไฟล์**: `src/auth/auth.controller.ts`

```typescript
@Get('ku/login')
kuLogin(@Req() req, @Query('callbackUrl') callbackUrl?: string) {
  // เก็บ callbackUrl ไว้ใน session เพื่อใช้หลัง OAuth callback
  if (callbackUrl) {
    req.session.callbackUrl = callbackUrl
  }
  
  // Redirect to KU OAuth
  // ... existing code ...
}
```

---

### 3. ตรวจสอบ Cookie Settings

**ไฟล์**: `src/auth/auth.service.ts` หรือที่ set cookie

**Checklist**:
- ✅ `httpOnly: true` - ป้องกัน XSS
- ✅ `secure: true` (production only) - ใช้ได้เฉพาะ HTTPS
- ✅ `sameSite: 'lax'` - **ไม่ใช่ 'strict'** (สำคัญมาก!)
- ✅ `path: '/'` - ใช้ได้ทุก path
- ✅ `domain: undefined` - หรือตั้งค่าให้ถูกต้องถ้าใช้ subdomain
- ✅ `maxAge: 7 * 24 * 60 * 60 * 1000` - 7 วัน

**ตัวอย่าง**:
```typescript
// Development (HTTP)
res.cookie('access_token', token, {
  httpOnly: true,
  secure: false, // HTTP
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
})

// Production (HTTPS)
res.cookie('access_token', token, {
  httpOnly: true,
  secure: true, // HTTPS
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
})
```

---

### 4. ตรวจสอบ CORS Configuration

**ไฟล์**: `src/main.ts`

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL, // ⚠️ ต้องระบุชัดเจน ไม่ใช่ '*'
  credentials: true, // ⚠️ สำคัญมาก!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

**ตรวจสอบ**:
- ✅ `credentials: true`
- ✅ `origin: <frontend-url>` (ไม่ใช่ `'*'`)

---

### 5. Environment Variables

**ไฟล์**: `.env`

```bash
# Frontend URL (สำหรับ redirect)
FRONTEND_URL=http://localhost:3000
# หรือ production
FRONTEND_URL=https://yourdomain.com

# CORS Origin (ต้องเหมือนกับ FRONTEND_URL)
CORS_ORIGIN=http://localhost:3000

# JWT Secret (ต้องเหมือนกับ Frontend)
JWT_SECRET=your-secret-key-here

# KU OAuth
KU_CLIENT_ID=your-client-id
KU_CLIENT_SECRET=your-client-secret
KU_CALLBACK_URL=http://localhost:3001/auth/ku/callback
```

---

## 🧪 วิธีทดสอบ

### 1. ทดสอบ Cookie ถูก Set หรือไม่

```bash
# ใช้ curl ทดสอบ
curl -v http://localhost:3001/auth/ku/callback

# ดู Response Headers ควรเห็น:
# Set-Cookie: access_token=xxx; Path=/; HttpOnly; SameSite=Lax
```

### 2. ทดสอบ Redirect URL

```bash
# ควร redirect ไปที่:
# http://localhost:3000/auth/processing?profileComplete=true&callbackUrl=%2F
```

### 3. ทดสอบ CORS

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     http://localhost:3001/auth/ku/login

# ควรเห็น:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

---

## 📝 Checklist

- [ ] แก้ไข `/auth/ku/callback` ให้ redirect ไปที่ `/auth/processing`
- [ ] เพิ่ม query params: `profileComplete` และ `callbackUrl`
- [ ] แก้ไข `/auth/ku/login` ให้เก็บ `callbackUrl` ใน session
- [ ] ตรวจสอบ cookie settings:
  - [ ] `sameSite: 'lax'` (ไม่ใช่ 'strict')
  - [ ] `secure: true` (production only)
  - [ ] `httpOnly: true`
  - [ ] `path: '/'`
- [ ] ตรวจสอบ CORS:
  - [ ] `credentials: true`
  - [ ] `origin: <frontend-url>` (ไม่ใช่ '*')
- [ ] ตรวจสอบ Environment Variables
- [ ] ทดสอบ flow ทั้งหมด

---

## 🔗 Related Files

- Frontend: `src/app/auth/processing/page.tsx` (สร้างแล้ว ✅)
- Frontend: `src/services/authService.ts` (แก้ไขแล้ว ✅)
- Frontend: `src/app/login/page.tsx` (แก้ไขแล้ว ✅)
- Frontend: `src/proxy.ts` (มี `/auth/processing` ใน PUBLIC_WHEN_UNAUTH แล้ว ✅)

---

## 📚 อ้างอิง

- [NestJS Cookies](https://docs.nestjs.com/techniques/cookies)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
