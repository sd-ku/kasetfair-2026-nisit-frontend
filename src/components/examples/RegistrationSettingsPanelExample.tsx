"use client";

import { useState, useEffect } from "react";
import { useRegistrationLock } from "@/hooks/useRegistrationLock";

/**
 * Example component showing full registration settings management
 * Includes manual lock, time-based lock, and custom messages
 */
export default function RegistrationSettingsPanelExample() {
    const { settings, loading, error, update } = useRegistrationLock();

    // Form state
    const [isManuallyLocked, setIsManuallyLocked] = useState(false);
    const [lockMessage, setLockMessage] = useState("");
    const [registrationStart, setRegistrationStart] = useState("");
    const [registrationEnd, setRegistrationEnd] = useState("");
    const [saving, setSaving] = useState(false);

    // Sync form state with settings
    useEffect(() => {
        if (settings) {
            setIsManuallyLocked(settings.isManuallyLocked);
            setLockMessage(settings.lockMessage);
            setRegistrationStart(
                settings.registrationStart
                    ? new Date(settings.registrationStart).toISOString().slice(0, 16)
                    : ""
            );
            setRegistrationEnd(
                settings.registrationEnd
                    ? new Date(settings.registrationEnd).toISOString().slice(0, 16)
                    : ""
            );
        }
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await update({
                isManuallyLocked,
                lockMessage,
                registrationStart: registrationStart
                    ? new Date(registrationStart).toISOString()
                    : null,
                registrationEnd: registrationEnd
                    ? new Date(registrationEnd).toISOString()
                    : null,
            });
            alert("Settings saved successfully!");
        } catch (err) {
            alert("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleClearDates = () => {
        setRegistrationStart("");
        setRegistrationEnd("");
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
        <div className="p-6 border rounded-lg shadow-sm max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Registration Settings</h2>

            {/* Current Status Banner */}
            <div
                className={`mb-6 p-4 rounded-lg ${settings.isCurrentlyLocked
                    ? "bg-red-50 border border-red-200"
                    : "bg-green-50 border border-green-200"
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-lg">
                            {settings.isCurrentlyLocked
                                ? "🔒 Registration is Currently LOCKED"
                                : "🔓 Registration is Currently OPEN"}
                        </p>
                        <p className="text-sm mt-1">
                            {settings.isManuallyLocked && "Manually locked by admin"}
                            {!settings.isManuallyLocked &&
                                settings.isCurrentlyLocked &&
                                "Locked by time-based settings"}
                            {!settings.isCurrentlyLocked && "Users can register normally"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <div className="space-y-6">
                {/* Manual Lock Toggle */}
                <div className="border-b pb-4">
                    <h3 className="font-semibold mb-3">Manual Lock</h3>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isManuallyLocked}
                            onChange={(e) => setIsManuallyLocked(e.target.checked)}
                            className="w-5 h-5"
                        />
                        <span>
                            Lock registration immediately (overrides time-based settings)
                        </span>
                    </label>
                    <p className="text-sm text-gray-600 mt-2">
                        Use this for emergency lockdown or maintenance
                    </p>
                </div>

                {/* Lock Message */}
                <div className="border-b pb-4">
                    <h3 className="font-semibold mb-3">Lock Message</h3>
                    <label className="block text-sm text-gray-700 mb-2">
                        Message to display when registration is locked:
                    </label>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={lockMessage}
                        onChange={(e) => setLockMessage(e.target.value)}
                        rows={3}
                        placeholder="e.g., ขณะนี้หมดเวลาลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย"
                    />
                </div>

                {/* Time-based Lock */}
                <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Time-based Lock</h3>
                        <button
                            type="button"
                            onClick={handleClearDates}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear Dates
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Set registration period. System will automatically lock outside this
                        period.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Registration Start
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={registrationStart}
                                onChange={(e) => setRegistrationStart(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Registration End
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={registrationEnd}
                                onChange={(e) => setRegistrationEnd(e.target.value)}
                            />
                        </div>

                        {registrationStart && registrationEnd && (
                            <div className="p-3 bg-blue-50 rounded-lg text-sm">
                                <p className="font-medium">Preview:</p>
                                <p>
                                    Registration will be open from{" "}
                                    <strong>
                                        {new Date(registrationStart).toLocaleString("th-TH", { hour12: false })}
                                    </strong>{" "}
                                    to{" "}
                                    <strong>
                                        {new Date(registrationEnd).toLocaleString("th-TH", { hour12: false })}
                                    </strong>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-500">
                        Last updated: {new Date(settings.updatedAt).toLocaleString("th-TH", { hour12: false })}
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold mb-2">ℹ️ Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Manual lock takes priority over time-based settings</li>
                    <li>Admin users can still modify data when locked</li>
                    <li>GET endpoints remain accessible when locked</li>
                    <li>Leave dates empty to disable time-based locking</li>
                </ul>
            </div>
        </div>
    );
}
