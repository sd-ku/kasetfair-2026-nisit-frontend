# Example Components

This directory contains example components demonstrating how to use various services and hooks in the application.

## Registration Lock Examples

### 1. RegistrationLockToggleExample.tsx

A simple toggle component for locking/unlocking registration.

**Features:**
- Display current lock status
- Toggle button for lock/unlock
- Custom lock message input
- Time-based lock information display
- Error handling

**Usage:**
```typescript
import RegistrationLockToggleExample from "@/components/examples/RegistrationLockToggleExample";

export default function AdminPage() {
    return (
        <div>
            <h1>Admin Dashboard</h1>
            <RegistrationLockToggleExample />
        </div>
    );
}
```

### 2. RegistrationSettingsPanelExample.tsx

A comprehensive settings panel for managing all registration lock settings.

**Features:**
- Manual lock toggle
- Lock message editor
- Time-based period selector with datetime inputs
- Preview of selected period
- Clear dates functionality
- Complete error handling
- Info box with important notes

**Usage:**
```typescript
import RegistrationSettingsPanelExample from "@/components/examples/RegistrationSettingsPanelExample";

export default function SettingsPage() {
    return (
        <div>
            <h1>Registration Settings</h1>
            <RegistrationSettingsPanelExample />
        </div>
    );
}
```

## How to Use These Examples

### Option 1: Use Directly
Copy the example component to your page and use it as-is.

### Option 2: Customize
Copy the example component and modify it to fit your design system and requirements.

### Option 3: Learn from It
Study the code to understand how to use the `useRegistrationLock` hook and build your own custom component.

## Related Documentation

- **Hook Documentation**: See `src/hooks/useRegistrationLock.ts`
- **Service Documentation**: See `src/services/admin/registrationLockService.ts`
- **Usage Guide**: See `docs/REGISTRATION_LOCK_USAGE.md`
- **Complete Guide**: See `docs/REGISTRATION_LOCK_COMPLETE.md`

## Notes

- These are example components meant for demonstration
- Feel free to modify them to match your design system
- All components use the `useRegistrationLock` hook for state management
- Components include proper error handling and loading states
