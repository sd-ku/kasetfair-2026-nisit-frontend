# สคริปต์สำหรับเพิ่ม Registration Lock ในหน้าที่เหลือ

## ✅ เสร็จแล้ว:
- `/register` - ลงทะเบียนนิสิต
- `/store/create` - สร้างร้านค้า  
- `/info` - แก้ไขข้อมูลนิสิต
- `/store/goods` - จัดการสินค้า

## 📝 หน้าที่ต้องทำต่อ:

### 1. `/store/club-info/page.tsx`
### 2. `/store/layout/page.tsx`
### 3. `/store/info/page.tsx`

---

## วิธีเพิ่มแบบย่อ (สำหรับทุกหน้า):

```tsx
// 1. Import
import { useRegistrationLock } from "@/hooks/useRegistrationLock"
import { RegistrationLockWarning } from "@/components/RegistrationLockWarning"
import { STORE_LOCK_MESSAGES } from "@/utils/registrationLockHelper"

// 2. Add hook
const { settings: lockSettings, loading: lockLoading } = useRegistrationLock()

// 3. Update loading check
if (loading || lockLoading) { return <Loading /> }

// 4. Get lock status
const isLocked = lockSettings?.isCurrentlyLocked ?? false

// 5. Show warning (หลัง header, ก่อน form)
{isLocked && (
  <RegistrationLockWarning 
    title={STORE_LOCK_MESSAGES.title}
    message={lockSettings?.lockMessage || STORE_LOCK_MESSAGES.defaultMessage}
  />
)}

// 6. Disable ALL inputs
<Input disabled={saving || isLocked} />
<GoogleFileUpload disabled={saving || isLocked} />
<Textarea disabled={saving || isLocked} />
<Select disabled={saving || isLocked} />

// 7. Disable ALL buttons
<Button disabled={saving || isLocked}>
  {isLocked 
    ? STORE_LOCK_MESSAGES.buttonText
    : saving 
      ? "กำลังบันทึก..." 
      : "บันทึก"}
</Button>
```

---

## สำหรับผู้ใช้:

คุณสามารถ copy code ด้านบนไปใช้ในหน้าที่เหลือได้เลย โดย:

1. เปิดไฟล์ที่ต้องการแก้
2. ทำตาม 7 ขั้นตอนด้านบน
3. ตรวจสอบว่า disable ทุก input/button แล้ว
4. Test ว่าทำงานถูกต้อง

---

## หมายเหตุ:

- ใช้ `STORE_LOCK_MESSAGES` สำหรับหน้า store
- ใช้ `NISIT_LOCK_MESSAGES` สำหรับหน้า nisit (ถ้ามี)
- อย่าลืมเพิ่ม `|| isLocked` ในทุก `disabled` prop
- ตรวจสอบว่าไม่มี input/button ไหนที่ลืม disable

---

## ตัวอย่างไฟล์ที่ทำเสร็จแล้ว:

- `src/app/info/page.tsx` - ตัวอย่างหน้า PATCH ที่สมบูรณ์
- `src/app/store/goods/page.tsx` - ตัวอย่างหน้าที่ซับซ้อน (CREATE/UPDATE/DELETE)
