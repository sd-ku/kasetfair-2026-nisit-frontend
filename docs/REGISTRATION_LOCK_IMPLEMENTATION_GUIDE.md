# วิธีเพิ่ม Registration Lock ในหน้าแก้ไขข้อมูล (PATCH Pages)

## ✅ หน้าที่เพิ่ม Lock แล้ว
- ✅ `/register` - หน้าลงทะเบียนนิสิต (POST)
- ✅ `/store/create` - หน้าสร้างร้านค้า (POST)
- ✅ `/info` - หน้าแก้ไขข้อมูลนิสิต (PATCH)

## 📝 หน้าที่ต้องเพิ่ม Lock
- ⏳ `/store/goods` - จัดการสินค้า (POST/PATCH/DELETE)
- ⏳ `/store/club-info` - แก้ไขข้อมูลชมรม (PATCH)
- ⏳ `/store/layout` - จัดการเลย์เอาต์ร้าน (PATCH)
- ⏳ `/store/info` - แก้ไขข้อมูลร้าน (PATCH)

## 🔧 วิธีการเพิ่ม (5 ขั้นตอน)

### 1. Import Dependencies
```tsx
import { useRegistrationLock } from "@/hooks/useRegistrationLock"
import { RegistrationLockWarning } from "@/components/RegistrationLockWarning"
import { STORE_LOCK_MESSAGES } from "@/utils/registrationLockHelper"
```

### 2. เพิ่ม Hook ในคอมโพเนนต์
```tsx
export default function YourPage() {
  const { settings: lockSettings, loading: lockLoading } = useRegistrationLock()
  const [saving, setSaving] = useState(false)
  
  // ... existing code
}
```

### 3. เพิ่มการเช็ค Loading
```tsx
// เดิม
if (loading) {
  return <LoadingComponent />
}

// ใหม่ - เพิ่ม lockLoading
if (loading || lockLoading) {
  return <LoadingComponent />
}
```

### 4. เพิ่ม Lock Status และ Warning
```tsx
// หลัง loading check
const isLocked = lockSettings?.isCurrentlyLocked ?? false

return (
  <div>
    {/* แสดง Warning เมื่อ locked */}
    {isLocked && (
      <RegistrationLockWarning 
        title={STORE_LOCK_MESSAGES.title}
        message={lockSettings?.lockMessage || STORE_LOCK_MESSAGES.defaultMessage}
      />
    )}
    
    {/* Form ของคุณ */}
  </div>
)
```

### 5. Disable Inputs และ Buttons
```tsx
// Input fields
<Input 
  disabled={saving || isLocked}
  // ... other props
/>

// File uploads
<GoogleFileUpload
  disabled={saving || isLocked}
  // ... other props
/>

// Buttons
<Button 
  disabled={saving || isLocked}
>
  {isLocked 
    ? STORE_LOCK_MESSAGES.buttonText
    : saving 
      ? "กำลังบันทึก..." 
      : "บันทึก"
  }
</Button>
```

## 📋 ตัวอย่างโค้ดเต็ม

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRegistrationLock } from "@/hooks/useRegistrationLock"
import { RegistrationLockWarning } from "@/components/RegistrationLockWarning"
import { STORE_LOCK_MESSAGES } from "@/utils/registrationLockHelper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function StoreEditPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })
  
  // 1. เพิ่ม hook
  const { settings: lockSettings, loading: lockLoading } = useRegistrationLock()

  useEffect(() => {
    // Load data...
    setLoading(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLocked) return // ป้องกันการ submit
    
    setSaving(true)
    try {
      // Save logic...
    } finally {
      setSaving(false)
    }
  }

  // 2. เช็ค loading
  if (loading || lockLoading) {
    return <div>Loading...</div>
  }

  // 3. Get lock status
  const isLocked = lockSettings?.isCurrentlyLocked ?? false

  return (
    <div className="container">
      <h1>แก้ไขข้อมูลร้าน</h1>

      {/* 4. แสดง warning */}
      {isLocked && (
        <RegistrationLockWarning 
          title={STORE_LOCK_MESSAGES.title}
          message={lockSettings?.lockMessage || STORE_LOCK_MESSAGES.defaultMessage}
        />
      )}

      <form onSubmit={handleSubmit}>
        {/* 5. Disable inputs */}
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={saving || isLocked}
        />

        <Button 
          type="submit" 
          disabled={saving || isLocked}
        >
          {isLocked
            ? STORE_LOCK_MESSAGES.buttonText
            : saving
              ? "กำลังบันทึก..."
              : "บันทึกการเปลี่ยนแปลง"}
        </Button>
      </form>
    </div>
  )
}
```

## 🎯 หน้าที่มีความซับซ้อน (เช่น /store/goods)

สำหรับหน้าที่มี multiple actions (CREATE, UPDATE, DELETE):

```tsx
// Disable ทุก action
<Button 
  onClick={handleCreate}
  disabled={saving || isLocked}
>
  เพิ่มสินค้า
</Button>

<Button 
  onClick={() => handleUpdate(id)}
  disabled={saving || isLocked}
>
  บันทึก
</Button>

<Button 
  onClick={() => handleDelete(id)}
  disabled={deleting || isLocked}
>
  ลบ
</Button>

// ป้องกันการ submit ใน handler
const handleCreate = async () => {
  if (isLocked) {
    toast({
      variant: "error",
      description: "ไม่สามารถเพิ่มสินค้าได้ในขณะนี้"
    })
    return
  }
  // ... create logic
}
```

## 🚨 สิ่งที่ต้องระวัง

1. **ต้อง disable ทุก input/button** - รวมถึง file upload, select, textarea
2. **ป้องกันใน handler** - เพิ่มการเช็ค `if (isLocked) return` ใน submit handlers
3. **แสดงข้อความที่ชัดเจน** - ใช้ lock message จาก admin
4. **Loading state** - เช็คทั้ง `loading` และ `lockLoading`

## 📚 Resources

- Hook: `src/hooks/useRegistrationLock.ts`
- Component: `src/components/RegistrationLockWarning.tsx`
- Helper: `src/utils/registrationLockHelper.ts`
- ตัวอย่าง: `src/app/info/page.tsx` (Nisit edit)
- ตัวอย่าง: `src/app/register/page.tsx` (Nisit create)
- ตัวอย่าง: `src/app/store/create/page.tsx` (Store create)
