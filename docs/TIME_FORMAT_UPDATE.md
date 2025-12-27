# Time Format Update - 24-Hour Format

## สรุปการเปลี่ยนแปลง

เปลี่ยนการแสดงเวลาทั้งหมดจากรูปแบบ 12 ชั่วโมง (AM/PM) เป็นรูปแบบ 24 ชั่วโมง (0-23)

## ไฟล์ที่แก้ไข

### 1. RegistrationLockToggleExample.tsx
**Path:** `src/components/examples/RegistrationLockToggleExample.tsx`

เปลี่ยน:
- Time-based Lock display (Start/End times)
- Last Updated timestamp

**Before:**
```tsx
{new Date(settings.registrationStart).toLocaleString()}
{new Date(settings.updatedAt).toLocaleString()}
```

**After:**
```tsx
{new Date(settings.registrationStart).toLocaleString("th-TH", { hour12: false })}
{new Date(settings.updatedAt).toLocaleString("th-TH", { hour12: false })}
```

### 2. RegistrationSettingsPanelExample.tsx
**Path:** `src/components/examples/RegistrationSettingsPanelExample.tsx`

เปลี่ยน:
- Preview section (Start/End times)
- Last Updated timestamp

**Before:**
```tsx
{new Date(registrationStart).toLocaleString()}
{new Date(registrationEnd).toLocaleString()}
{new Date(settings.updatedAt).toLocaleString()}
```

**After:**
```tsx
{new Date(registrationStart).toLocaleString("th-TH", { hour12: false })}
{new Date(registrationEnd).toLocaleString("th-TH", { hour12: false })}
{new Date(settings.updatedAt).toLocaleString("th-TH", { hour12: false })}
```

### 3. registration-settings/page.tsx
**Path:** `src/app/admin/registration-settings/page.tsx`

เปลี่ยน:
- Preview section (Start/End times)
- Last Updated timestamp

**Before:**
```tsx
{new Date(registrationStart).toLocaleString("th-TH")}
{new Date(registrationEnd).toLocaleString("th-TH")}
{new Date(settings.updatedAt).toLocaleString("th-TH")}
```

**After:**
```tsx
{new Date(registrationStart).toLocaleString("th-TH", { hour12: false })}
{new Date(registrationEnd).toLocaleString("th-TH", { hour12: false })}
{new Date(settings.updatedAt).toLocaleString("th-TH", { hour12: false })}
```

## การเปลี่ยนแปลง

### ก่อนแก้ไข
- เวลาแสดงเป็น: `27/12/2568 16:30:00` (12-hour format with AM/PM in some locales)
- หรือ: `12/27/2025, 4:30:00 PM`

### หลังแก้ไข
- เวลาแสดงเป็น: `27/12/2568 16:30:00` (24-hour format)
- ชั่วโมงเป็น 0-23 แทนที่จะเป็น 1-12 + AM/PM

## Options ที่ใช้

```typescript
toLocaleString("th-TH", { hour12: false })
```

- `"th-TH"` - ใช้ locale ภาษาไทย
- `{ hour12: false }` - ใช้รูปแบบ 24 ชั่วโมง (0-23)

## ตัวอย่างผลลัพธ์

### Time-based Lock Display
```
Start: 15/1/2568 00:00:00
End: 28/2/2568 23:59:59
```

### Last Updated
```
Last updated: 27/12/2568 16:30:45
```

## ✅ Validation

- ✅ TypeScript compilation ผ่าน
- ✅ เปลี่ยนแปลงทุกไฟล์ที่เกี่ยวข้อง
- ✅ ใช้ format เดียวกันทั้งหมด
- ✅ รองรับ locale ภาษาไทย

---

**Updated**: 2025-12-27  
**Format**: 24-hour (0-23)  
**Locale**: th-TH
