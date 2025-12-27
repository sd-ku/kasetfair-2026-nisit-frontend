# Registration Lock Service Implementation

## สรุปการเพิ่มฟีเจอร์

ได้เพิ่มการเรียกใช้ Registration Lock Service ใน frontend ตามคู่มือจาก backend

## ไฟล์ที่สร้างขึ้น

### 1. DTO Types
**Path:** `src/services/admin/dto/registration-lock.dto.ts`

ประกอบด้วย:
- `RegistrationSettingsDto` - Response type สำหรับการตั้งค่า
- `UpdateRegistrationSettingsDto` - Request type สำหรับอัปเดตการตั้งค่า
- `RegistrationLockErrorDto` - Error response type เมื่อระบบ lock

### 2. Service Functions
**Path:** `src/services/admin/registrationLockService.ts`

ฟังก์ชันที่มี:
- `getRegistrationSettings()` - ดูการตั้งค่าปัจจุบัน
- `updateRegistrationSettings(settings)` - อัปเดตการตั้งค่าแบบกำหนดเอง
- `lockRegistration(lockMessage?)` - Lock ระบบทันที (manual lock)
- `unlockRegistration()` - Unlock ระบบ
- `setRegistrationPeriod(start, end, lockMessage?)` - ตั้งเวลาเปิด-ปิดอัตโนมัติ
- `clearRegistrationPeriod()` - ยกเลิกการตั้งเวลาอัตโนมัติ

### 3. Index File
**Path:** `src/services/admin/index.ts`

Re-export ทุก admin services เพื่อความสะดวกในการ import

### 4. Documentation
**Path:** `docs/REGISTRATION_LOCK_USAGE.md`

คู่มือการใช้งานพร้อมตัวอย่าง:
- การใช้งานแต่ละฟังก์ชัน
- ตัวอย่าง React Component (Toggle และ Full Settings Panel)
- Error handling
- Notes และข้อควรระวัง

## การใช้งาน

### Import แบบง่าย
```typescript
import {
    getRegistrationSettings,
    lockRegistration,
    unlockRegistration,
} from "@/services/admin/registrationLockService";
```

### Import จาก index
```typescript
import {
    getRegistrationSettings,
    lockRegistration,
    unlockRegistration,
} from "@/services/admin";
```

### ตัวอย่างการใช้งานพื้นฐาน
```typescript
// ดูการตั้งค่า
const settings = await getRegistrationSettings();

// Lock ระบบ
await lockRegistration("ระบบปิดปรับปรุงชั่วคราว");

// Unlock ระบบ
await unlockRegistration();

// ตั้งเวลา
await setRegistrationPeriod(
    "2025-01-15T00:00:00.000Z",
    "2025-02-28T23:59:59.999Z",
    "ช่วงเวลาลงทะเบียน: 15 ม.ค. - 28 ก.พ. 2568"
);
```

## API Endpoints ที่ใช้

- `GET /api/admin/registration/settings` - ดูการตั้งค่า
- `PATCH /api/admin/registration/settings` - อัปเดตการตั้งค่า

## TypeScript Validation

✅ ผ่านการตรวจสอบ TypeScript (`npx tsc --noEmit`)

## ขั้นตอนถัดไป

คุณสามารถนำ service นี้ไปใช้ในหน้า Admin Dashboard ได้เลย เช่น:

1. สร้างหน้า Registration Settings ใน Admin Panel
2. เพิ่ม Toggle Lock/Unlock ใน Dashboard
3. เพิ่มฟอร์มตั้งเวลาเปิด-ปิดลงทะเบียน
4. แสดงสถานะ Lock ปัจจุบันใน Dashboard

ดูตัวอย่างการใช้งานเพิ่มเติมได้ที่ `docs/REGISTRATION_LOCK_USAGE.md`
