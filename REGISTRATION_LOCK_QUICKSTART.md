# Registration Lock Service - Quick Start Guide

## 🎯 สรุปสั้นๆ

เพิ่มการเรียกใช้ Registration Lock Service ใน frontend เรียบร้อยแล้ว! ระบบนี้ช่วยให้ admin สามารถเปิด-ปิดการลงทะเบียนของ Nisit และ Store ได้

## 📦 ไฟล์ที่สำคัญ

```
kasetfair2026-frontend/
├── src/
│   ├── services/admin/
│   │   ├── dto/registration-lock.dto.ts          # Types
│   │   ├── registrationLockService.ts            # Service functions
│   │   └── index.ts                              # Re-exports
│   ├── hooks/
│   │   └── useRegistrationLock.ts                # React Hook
│   └── components/examples/
│       ├── RegistrationLockToggleExample.tsx     # Simple toggle
│       └── RegistrationSettingsPanelExample.tsx  # Full panel
└── docs/
    ├── REGISTRATION_LOCK_USAGE.md                # คู่มือการใช้งาน
    ├── REGISTRATION_LOCK_IMPLEMENTATION.md       # รายละเอียด implementation
    └── REGISTRATION_LOCK_COMPLETE.md             # สรุปทั้งหมด
```

## 🚀 เริ่มใช้งานเลย (3 ขั้นตอน)

### 1. Import Hook
```typescript
import { useRegistrationLock } from "@/hooks/useRegistrationLock";
```

### 2. ใช้ใน Component
```typescript
function MyComponent() {
    const { settings, loading, lock, unlock } = useRegistrationLock();
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div>
            <p>Status: {settings?.isCurrentlyLocked ? "🔒" : "🔓"}</p>
            <button onClick={() => lock()}>Lock</button>
            <button onClick={() => unlock()}>Unlock</button>
        </div>
    );
}
```

### 3. หรือใช้ Component สำเร็จรูป
```typescript
import RegistrationLockToggleExample from "@/components/examples/RegistrationLockToggleExample";

// ใน page
<RegistrationLockToggleExample />
```

## 🔧 ฟังก์ชันหลักๆ

### Service Functions
```typescript
import {
    getRegistrationSettings,    // ดูการตั้งค่า
    lockRegistration,           // Lock ทันที
    unlockRegistration,         // Unlock
    setRegistrationPeriod,      // ตั้งเวลาเปิด-ปิด
    updateRegistrationSettings, // อัปเดตการตั้งค่า
} from "@/services/admin/registrationLockService";
```

### Hook Methods
```typescript
const {
    settings,   // ข้อมูลการตั้งค่า
    loading,    // สถานะโหลด
    error,      // ข้อความ error
    refresh,    // โหลดใหม่
    lock,       // Lock ระบบ
    unlock,     // Unlock ระบบ
    update,     // อัปเดตการตั้งค่า
} = useRegistrationLock();
```

## 📖 ตัวอย่างการใช้งาน

### Lock ระบบทันที
```typescript
await lockRegistration("ระบบปิดปรับปรุงชั่วคราว");
```

### Unlock ระบบ
```typescript
await unlockRegistration();
```

### ตั้งเวลาเปิด-ปิด
```typescript
await setRegistrationPeriod(
    "2025-01-15T00:00:00.000Z",
    "2025-02-28T23:59:59.999Z",
    "ช่วงเวลาลงทะเบียน: 15 ม.ค. - 28 ก.พ. 2568"
);
```

## 📚 เอกสารเพิ่มเติม

- **คู่มือการใช้งานแบบละเอียด**: `docs/REGISTRATION_LOCK_USAGE.md`
- **รายละเอียด Implementation**: `docs/REGISTRATION_LOCK_IMPLEMENTATION.md`
- **สรุปทั้งหมด**: `docs/REGISTRATION_LOCK_COMPLETE.md`
- **Backend Documentation**: `../kasetfair2026-backend/docs/REGISTRATION_LOCK.md`

## ✅ Status

- ✅ TypeScript compilation ผ่าน
- ✅ Service functions พร้อมใช้
- ✅ React Hook พร้อมใช้
- ✅ Example components พร้อมใช้
- ✅ Documentation ครบถ้วน

## 🎨 Example Components

มี 2 ตัวอย่างพร้อมใช้:

1. **RegistrationLockToggleExample** - Toggle แบบง่าย
2. **RegistrationSettingsPanelExample** - Panel แบบเต็มรูปแบบ

ดูรายละเอียดได้ที่ `src/components/examples/README.md`

---

**Created**: 2025-12-27  
**Ready to use**: ✅ Yes
