# Registration Lock Service - Usage Examples

## Overview
Service สำหรับจัดการการเปิด-ปิดลงทะเบียนสำหรับ Nisit และ Store

## Import
```typescript
import {
    getRegistrationSettings,
    updateRegistrationSettings,
    lockRegistration,
    unlockRegistration,
    setRegistrationPeriod,
    clearRegistrationPeriod,
} from "@/services/admin/registrationLockService";
```

## Usage Examples

### 1. ดูการตั้งค่าปัจจุบัน
```typescript
const settings = await getRegistrationSettings();
console.log(settings);
// {
//   id: 1,
//   isManuallyLocked: false,
//   registrationStart: "2025-01-01T00:00:00.000Z",
//   registrationEnd: "2025-12-31T23:59:59.999Z",
//   lockMessage: "ขณะนี้หมดเวลาลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย",
//   isCurrentlyLocked: false,
//   createdAt: "2025-12-27T08:00:00.000Z",
//   updatedAt: "2025-12-27T08:00:00.000Z"
// }
```

### 2. Lock ระบบทันที (Manual Lock)
```typescript
// Lock พร้อมข้อความ default
await lockRegistration();

// Lock พร้อมข้อความกำหนดเอง
await lockRegistration("ระบบปิดปรับปรุงชั่วคราว กรุณาลองใหม่ภายหลัง");
```

### 3. Unlock ระบบ
```typescript
await unlockRegistration();
```

### 4. ตั้งเวลาเปิด-ปิดลงทะเบียนอัตโนมัติ
```typescript
// ตั้งช่วงเวลา
await setRegistrationPeriod(
    "2025-01-15T00:00:00.000Z",
    "2025-02-28T23:59:59.999Z",
    "ช่วงเวลาลงทะเบียน: 15 ม.ค. - 28 ก.พ. 2568"
);

// ตั้งช่วงเวลาโดยไม่เปลี่ยนข้อความ
await setRegistrationPeriod(
    "2025-01-15T00:00:00.000Z",
    "2025-02-28T23:59:59.999Z"
);
```

### 5. ยกเลิกการตั้งเวลาอัตโนมัติ
```typescript
await clearRegistrationPeriod();
```

### 6. อัปเดตการตั้งค่าแบบกำหนดเอง
```typescript
// อัปเดตเฉพาะข้อความ
await updateRegistrationSettings({
    lockMessage: "ข้อความใหม่"
});

// อัปเดตหลายค่าพร้อมกัน
await updateRegistrationSettings({
    isManuallyLocked: true,
    lockMessage: "ระบบปิดปรับปรุง",
    registrationStart: "2025-01-01T00:00:00.000Z",
    registrationEnd: "2025-12-31T23:59:59.999Z"
});
```

## React Component Example

### Simple Lock/Unlock Toggle
```typescript
"use client";

import { useState, useEffect } from "react";
import {
    getRegistrationSettings,
    lockRegistration,
    unlockRegistration,
} from "@/services/admin/registrationLockService";
import type { RegistrationSettingsDto } from "@/services/admin/dto/registration-lock.dto";

export default function RegistrationLockToggle() {
    const [settings, setSettings] = useState<RegistrationSettingsDto | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getRegistrationSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const handleToggle = async () => {
        if (!settings) return;
        
        setLoading(true);
        try {
            if (settings.isManuallyLocked) {
                await unlockRegistration();
            } else {
                await lockRegistration();
            }
            await loadSettings();
        } catch (error) {
            console.error("Failed to toggle lock:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!settings) return <div>Loading...</div>;

    return (
        <div>
            <h2>Registration Lock Control</h2>
            <p>Status: {settings.isCurrentlyLocked ? "🔒 Locked" : "🔓 Unlocked"}</p>
            <p>Manual Lock: {settings.isManuallyLocked ? "Yes" : "No"}</p>
            <button onClick={handleToggle} disabled={loading}>
                {loading ? "Processing..." : settings.isManuallyLocked ? "Unlock" : "Lock"}
            </button>
        </div>
    );
}
```

### Full Settings Panel
```typescript
"use client";

import { useState, useEffect } from "react";
import {
    getRegistrationSettings,
    updateRegistrationSettings,
} from "@/services/admin/registrationLockService";
import type { RegistrationSettingsDto } from "@/services/admin/dto/registration-lock.dto";

export default function RegistrationSettingsPanel() {
    const [settings, setSettings] = useState<RegistrationSettingsDto | null>(null);
    const [isManuallyLocked, setIsManuallyLocked] = useState(false);
    const [lockMessage, setLockMessage] = useState("");
    const [registrationStart, setRegistrationStart] = useState("");
    const [registrationEnd, setRegistrationEnd] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (settings) {
            setIsManuallyLocked(settings.isManuallyLocked);
            setLockMessage(settings.lockMessage);
            setRegistrationStart(settings.registrationStart || "");
            setRegistrationEnd(settings.registrationEnd || "");
        }
    }, [settings]);

    const loadSettings = async () => {
        try {
            const data = await getRegistrationSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateRegistrationSettings({
                isManuallyLocked,
                lockMessage,
                registrationStart: registrationStart || null,
                registrationEnd: registrationEnd || null,
            });
            await loadSettings();
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Failed to update settings:", error);
            alert("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    if (!settings) return <div>Loading...</div>;

    return (
        <div className="p-4 max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Registration Settings</h2>
            
            <div className="mb-4 p-4 bg-gray-100 rounded">
                <p className="font-semibold">
                    Current Status: {settings.isCurrentlyLocked ? "🔒 Locked" : "🔓 Unlocked"}
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={isManuallyLocked}
                            onChange={(e) => setIsManuallyLocked(e.target.checked)}
                        />
                        <span>Manual Lock</span>
                    </label>
                </div>

                <div>
                    <label className="block mb-2">Lock Message</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        value={lockMessage}
                        onChange={(e) => setLockMessage(e.target.value)}
                        rows={3}
                    />
                </div>

                <div>
                    <label className="block mb-2">Registration Start</label>
                    <input
                        type="datetime-local"
                        className="w-full p-2 border rounded"
                        value={registrationStart ? new Date(registrationStart).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setRegistrationStart(e.target.value ? new Date(e.target.value).toISOString() : "")}
                    />
                </div>

                <div>
                    <label className="block mb-2">Registration End</label>
                    <input
                        type="datetime-local"
                        className="w-full p-2 border rounded"
                        value={registrationEnd ? new Date(registrationEnd).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setRegistrationEnd(e.target.value ? new Date(e.target.value).toISOString() : "")}
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}
```

## Error Handling

### Handling Registration Lock Errors
```typescript
import type { RegistrationLockErrorDto } from "@/services/admin/dto/registration-lock.dto";

try {
    // Some API call that might be locked
    await someProtectedAction();
} catch (error: any) {
    if (error.response?.data?.code === "REGISTRATION_LOCKED") {
        const lockError = error.response.data as RegistrationLockErrorDto;
        console.log("Registration is locked:", lockError.message);
        console.log("Period:", lockError.registrationStart, "to", lockError.registrationEnd);
    }
}
```

## Notes

- **Manual Lock** มีความสำคัญสูงกว่า Time-based Lock
- **Admin** ยังสามารถแก้ไขข้อมูลได้แม้ระบบ lock
- **GET endpoints** ยังใช้งานได้ตามปกติแม้ระบบ lock
- ระบบจะสร้างการตั้งค่าเริ่มต้นอัตโนมัติเมื่อเรียก API ครั้งแรก
