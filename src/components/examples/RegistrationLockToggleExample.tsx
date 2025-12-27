"use client";

import { useState } from "react";
import { useRegistrationLock } from "@/hooks/useRegistrationLock";

/**
 * Example component showing how to use the useRegistrationLock hook
 * This is a simple toggle component for locking/unlocking registration
 */
export default function RegistrationLockToggleExample() {
    const { settings, loading, error, lock, unlock } = useRegistrationLock();
    const [customMessage, setCustomMessage] = useState("");

    const handleToggle = async () => {
        try {
            if (settings?.isManuallyLocked) {
                await unlock();
            } else {
                await lock(customMessage || undefined);
                setCustomMessage(""); // Clear message after locking
            }
        } catch (err) {
            // Error is already handled by the hook
            console.error("Toggle failed:", err);
        }
    };

    if (loading && !settings) {
        return (
            <div className="p-4 border rounded">
                <p>Loading registration settings...</p>
            </div>
        );
    }

    if (error && !settings) {
        return (
            <div className="p-4 border border-red-500 rounded bg-red-50">
                <p className="text-red-700">Error: {error}</p>
            </div>
        );
    }

    if (!settings) {
        return null;
    }

    return (
        <div className="p-6 border rounded-lg shadow-sm max-w-md">
            <h2 className="text-xl font-bold mb-4">Registration Lock Control</h2>

            {/* Status Display */}
            <div className="mb-4 p-4 rounded bg-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Current Status:</span>
                    <span className={`text-lg ${settings.isCurrentlyLocked ? "text-red-600" : "text-green-600"}`}>
                        {settings.isCurrentlyLocked ? "🔒 Locked" : "🔓 Unlocked"}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span>Manual Lock:</span>
                    <span>{settings.isManuallyLocked ? "Yes" : "No"}</span>
                </div>
            </div>

            {/* Lock Message Display */}
            {settings.isCurrentlyLocked && (
                <div className="mb-4 p-3 rounded bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                        <strong>Lock Message:</strong> {settings.lockMessage}
                    </p>
                </div>
            )}

            {/* Time-based Lock Info */}
            {(settings.registrationStart || settings.registrationEnd) && (
                <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-sm">
                    <p className="font-semibold mb-1">Time-based Lock:</p>
                    {settings.registrationStart && (
                        <p>Start: {new Date(settings.registrationStart).toLocaleString("th-TH", { hour12: false })}</p>
                    )}
                    {settings.registrationEnd && (
                        <p>End: {new Date(settings.registrationEnd).toLocaleString("th-TH", { hour12: false })}</p>
                    )}
                </div>
            )}

            {/* Custom Message Input (only when locking) */}
            {!settings.isManuallyLocked && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Custom Lock Message (Optional):
                    </label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded"
                        placeholder="e.g., ระบบปิดปรับปรุงชั่วคราว"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                    />
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                disabled={loading}
                className={`w-full py-2 px-4 rounded font-semibold transition-colors ${settings.isManuallyLocked
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
                {loading ? (
                    "Processing..."
                ) : settings.isManuallyLocked ? (
                    "🔓 Unlock Registration"
                ) : (
                    "🔒 Lock Registration"
                )}
            </button>

            {/* Error Display */}
            {error && (
                <div className="mt-4 p-3 rounded bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Last Updated */}
            <p className="mt-4 text-xs text-gray-500 text-center">
                Last updated: {new Date(settings.updatedAt).toLocaleString("th-TH", { hour12: false })}
            </p>
        </div>
    );
}
