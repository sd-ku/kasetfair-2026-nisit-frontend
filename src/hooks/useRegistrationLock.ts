"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getRegistrationSettings,
    updateRegistrationSettings,
    lockRegistration,
    unlockRegistration,
} from "@/services/admin/registrationLockService";
import { getStoreRegistrationSettings } from "@/services/storeRegistrationService";
import type {
    RegistrationSettingsDto,
    UpdateRegistrationSettingsDto,
} from "@/services/admin/dto/registration-lock.dto";

type RegistrationLockMode = 'admin' | 'store';

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
 * @param mode - 'admin' for full admin access, 'store' for read-only store access (default: 'store')
 * 
 * @example
 * ```tsx
 * // For admin pages
 * function AdminComponent() {
 *   const { settings, loading, lock, unlock } = useRegistrationLock('admin');
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
 * 
 * // For store pages (read-only)
 * function StoreComponent() {
 *   const { settings, loading } = useRegistrationLock('store');
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       <p>Status: {settings?.isCurrentlyLocked ? "Locked" : "Unlocked"}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegistrationLock(mode: RegistrationLockMode = 'store'): UseRegistrationLockReturn {
    const [settings, setSettings] = useState<RegistrationSettingsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Use appropriate API based on mode
            const data = mode === 'admin'
                ? await getRegistrationSettings()
                : await getStoreRegistrationSettings();

            setSettings(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load settings";
            setError(message);
            console.error("Failed to load registration settings:", err);

            // For store mode, set a default "unlocked" state on error to prevent blocking
            if (mode === 'store') {
                setSettings({
                    id: 0,
                    isManuallyLocked: false,
                    isCurrentlyLocked: false,
                    lockMessage: "",
                    registrationStart: null,
                    registrationEnd: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }
        } finally {
            setLoading(false);
        }
    }, [mode]);

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
