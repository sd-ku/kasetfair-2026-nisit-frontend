"use client";

import { useState, useEffect } from "react";
import { useRegistrationLock } from "@/hooks/useRegistrationLock";
import { Lock, Unlock, Calendar, MessageSquare, Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { DateTimePicker } from "@/components/DateTimePicker";

export default function RegistrationSettingsPage() {
    const { settings, loading, error, update } = useRegistrationLock();

    // Form state
    const [isManuallyLocked, setIsManuallyLocked] = useState(false);
    const [lockMessage, setLockMessage] = useState("");
    const [registrationStart, setRegistrationStart] = useState<Date | undefined>(undefined);
    const [registrationEnd, setRegistrationEnd] = useState<Date | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Sync form state with settings
    useEffect(() => {
        if (settings) {
            setIsManuallyLocked(settings.isManuallyLocked);
            setLockMessage(settings.lockMessage);
            setRegistrationStart(
                settings.registrationStart
                    ? new Date(settings.registrationStart)
                    : undefined
            );
            setRegistrationEnd(
                settings.registrationEnd
                    ? new Date(settings.registrationEnd)
                    : undefined
            );
        }
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            await update({
                isManuallyLocked,
                lockMessage,
                registrationStart: registrationStart
                    ? registrationStart.toISOString()
                    : null,
                registrationEnd: registrationEnd
                    ? registrationEnd.toISOString()
                    : null,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save settings:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleClearDates = () => {
        setRegistrationStart(undefined);
        setRegistrationEnd(undefined);
    };

    if (loading && !settings) {
        return (
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !settings) {
        return (
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                            <div>
                                <h3 className="font-semibold text-destructive">Error Loading Settings</h3>
                                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!settings) {
        return null;
    }

    return (
        <div className="flex-1 overflow-auto">
            <div className="p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Registration Settings</h1>
                        <p className="text-muted-foreground mt-2">
                            จัดการการเปิด-ปิดลงทะเบียนสำหรับ Nisit และ Store
                        </p>
                    </div>

                    {/* Current Status Banner */}
                    <div
                        className={`rounded-lg border p-6 ${settings.isCurrentlyLocked
                            ? "bg-destructive/5 border-destructive/20"
                            : "bg-green-500/5 border-green-500/20"
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`p-3 rounded-lg ${settings.isCurrentlyLocked
                                    ? "bg-destructive/10"
                                    : "bg-green-500/10"
                                    }`}
                            >
                                {settings.isCurrentlyLocked ? (
                                    <Lock className="h-6 w-6 text-destructive" />
                                ) : (
                                    <Unlock className="h-6 w-6 text-green-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold">
                                    {settings.isCurrentlyLocked
                                        ? "Registration is Currently LOCKED"
                                        : "Registration is Currently OPEN"}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {settings.isManuallyLocked && "Manually locked by admin"}
                                    {!settings.isManuallyLocked &&
                                        settings.isCurrentlyLocked &&
                                        "Locked by time-based settings"}
                                    {!settings.isCurrentlyLocked && "Users can register normally"}
                                </p>
                                {settings.isCurrentlyLocked && (
                                    <div className="mt-3 p-3 bg-background/50 rounded border">
                                        <p className="text-sm">
                                            <strong>Lock Message:</strong> {settings.lockMessage}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="bg-card border rounded-lg">
                        <div className="p-6 space-y-6">
                            {/* Manual Lock Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold">Manual Lock</h3>
                                </div>
                                <div className="pl-8 space-y-3">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isManuallyLocked}
                                            onChange={(e) => setIsManuallyLocked(e.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium group-hover:text-primary transition-colors">
                                                Lock registration immediately
                                            </span>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                This will override time-based settings. Use for emergency lockdown or maintenance.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t" />

                            {/* Lock Message Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold">Lock Message</h3>
                                </div>
                                <div className="pl-8 space-y-2">
                                    <label className="text-sm text-muted-foreground">
                                        Message to display when registration is locked:
                                    </label>
                                    <textarea
                                        className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                        value={lockMessage}
                                        onChange={(e) => setLockMessage(e.target.value)}
                                        rows={3}
                                        placeholder="e.g., ขณะนี้หมดเวลาลงทะเบียนแล้ว กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย"
                                    />
                                </div>
                            </div>

                            <div className="border-t" />

                            {/* Time-based Lock Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <h3 className="text-lg font-semibold">Time-based Lock</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearDates}
                                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                        Clear Dates
                                    </button>
                                </div>
                                <div className="pl-8 space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Set registration period. System will automatically lock outside this period.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Registration Start
                                            </label>
                                            <DateTimePicker
                                                value={registrationStart}
                                                onChange={setRegistrationStart}
                                                placeholder="Select start date and time"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Registration End
                                            </label>
                                            <DateTimePicker
                                                value={registrationEnd}
                                                onChange={setRegistrationEnd}
                                                placeholder="Select end date and time"
                                            />
                                        </div>
                                    </div>

                                    {registrationStart && registrationEnd && (
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                            <p className="text-sm font-medium mb-1">Preview:</p>
                                            <p className="text-sm">
                                                Registration will be open from{" "}
                                                <strong>
                                                    {registrationStart.toLocaleString("th-TH", { hour12: false })}
                                                </strong>{" "}
                                                to{" "}
                                                <strong>
                                                    {registrationEnd.toLocaleString("th-TH", { hour12: false })}
                                                </strong>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Last updated: {new Date(settings.updatedAt).toLocaleString("th-TH", { hour12: false })}
                            </p>
                            <button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : saveSuccess ? (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Saved!
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-muted/50 border rounded-lg p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold mb-2">Important Notes</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Manual lock takes priority over time-based settings</li>
                                    <li>• Admin users can still modify data when locked</li>
                                    <li>• GET endpoints remain accessible when locked</li>
                                    <li>• Leave dates empty to disable time-based locking</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
