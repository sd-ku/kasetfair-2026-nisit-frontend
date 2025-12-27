"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getRegistrationSettings,
    updateRegistrationSettings,
    lockRegistration,
    unlockRegistration,
} from "@/services/admin/registrationLockService";
import type {
    RegistrationSettingsDto,
    UpdateRegistrationSettingsDto,
} from "@/services/admin/dto/registration-lock.dto";

interface UseRegistrationLockReturn {
    settings: RegistrationSettingsDto | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    lock: (message?: string) => Promise<void>;
    unlock: () => Promise<void>;
    update: (settings: UpdateRegistrationSettingsDto) => Promise<void>;
}

/**
 * React Hook for managing Registration Lock settings
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { settings, loading, lock, unlock } = useRegistrationLock();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       <p>Status: {settings?.isCurrentlyLocked ? "Locked" : "Unlocked"}</p>
 *       <button onClick={() => lock()}>Lock</button>
 *       <button onClick={() => unlock()}>Unlock</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegistrationLock(): UseRegistrationLockReturn {
    const [settings, setSettings] = useState<RegistrationSettingsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getRegistrationSettings();
            setSettings(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load settings";
            setError(message);
            console.error("Failed to load registration settings:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const lock = useCallback(async (message?: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await lockRegistration(message);
            setSettings(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to lock registration";
            setError(errorMessage);
            console.error("Failed to lock registration:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const unlock = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await unlockRegistration();
            setSettings(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to unlock registration";
            setError(errorMessage);
            console.error("Failed to unlock registration:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const update = useCallback(async (newSettings: UpdateRegistrationSettingsDto) => {
        try {
            setLoading(true);
            setError(null);
            const data = await updateRegistrationSettings(newSettings);
            setSettings(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update settings";
            setError(errorMessage);
            console.error("Failed to update registration settings:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        settings,
        loading,
        error,
        refresh,
        lock,
        unlock,
        update,
    };
}
