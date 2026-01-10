'use client';

import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';

interface ImportBoothModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (formData: ImportFormData) => Promise<void>;
    initialPriorityStart: number;
    existingBooths?: Array<{ boothNumber: string }>; // Add existing booths to show import history
}

export interface ImportFormData {
    prefix: string;
    start: number;
    end: number;
    priorityStart: number;
}

interface BoothRange {
    prefix: string;
    start: number;
    end: number;
    count: number;
}

export function ImportBoothModal({ isOpen, onClose, onImport, initialPriorityStart, existingBooths = [] }: ImportBoothModalProps) {
    const [importForm, setImportForm] = useState<ImportFormData>({
        prefix: 'M',
        start: 1,
        end: 20,
        priorityStart: initialPriorityStart,
    });
    const [importing, setImporting] = useState(false);

    // Update priorityStart when initialPriorityStart changes
    React.useEffect(() => {
        setImportForm(prev => ({
            ...prev,
            priorityStart: initialPriorityStart,
        }));
    }, [initialPriorityStart]);

    // Calculate imported booth ranges from existing booths
    const importedRanges = useMemo(() => {
        if (!existingBooths || existingBooths.length === 0) return [];

        // Group booths by prefix
        const boothsByPrefix: Record<string, number[]> = {};

        existingBooths.forEach(booth => {
            const match = booth.boothNumber.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const prefix = match[1];
                const number = parseInt(match[2], 10);

                if (!boothsByPrefix[prefix]) {
                    boothsByPrefix[prefix] = [];
                }
                boothsByPrefix[prefix].push(number);
            }
        });

        // Convert to ranges
        const ranges: BoothRange[] = [];

        Object.entries(boothsByPrefix).forEach(([prefix, numbers]) => {
            // Sort numbers
            const sorted = numbers.sort((a, b) => a - b);

            // Group consecutive numbers into ranges
            let rangeStart = sorted[0];
            let rangeEnd = sorted[0];

            for (let i = 1; i <= sorted.length; i++) {
                if (i < sorted.length && sorted[i] === rangeEnd + 1) {
                    // Continue the range
                    rangeEnd = sorted[i];
                } else {
                    // End of range, add it
                    ranges.push({
                        prefix,
                        start: rangeStart,
                        end: rangeEnd,
                        count: rangeEnd - rangeStart + 1,
                    });

                    // Start new range
                    if (i < sorted.length) {
                        rangeStart = sorted[i];
                        rangeEnd = sorted[i];
                    }
                }
            }
        });

        // Sort by prefix, then by start number
        return ranges.sort((a, b) => {
            if (a.prefix !== b.prefix) {
                return a.prefix.localeCompare(b.prefix);
            }
            return a.start - b.start;
        });
    }, [existingBooths]);

    // Auto-fill start and end based on the last imported range
    React.useEffect(() => {
        if (importedRanges.length > 0) {
            // Get the last range (sorted by prefix then start)
            const lastRange = importedRanges[importedRanges.length - 1];
            const nextStart = lastRange.end + 1;
            const nextEnd = nextStart + 19; // +19 to make it 20 booths total (inclusive)

            setImportForm(prev => ({
                ...prev,
                prefix: lastRange.prefix,
                start: nextStart,
                end: nextEnd,
            }));
        }
    }, [importedRanges]);

    const handleImport = async () => {
        try {
            setImporting(true);
            await onImport(importForm);
            onClose();
        } catch (error) {
            // Error handling is done in parent component
            console.error('Import failed:', error);
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Import Booth (Range)</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Import Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                            <input
                                type="text"
                                value={importForm.prefix}
                                onChange={(e) => setImportForm({ ...importForm, prefix: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="M"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                                <input
                                    type="number"
                                    value={importForm.start}
                                    onChange={(e) => setImportForm({ ...importForm, start: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                                <input
                                    type="number"
                                    value={importForm.end}
                                    onChange={(e) => setImportForm({ ...importForm, end: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    min={1}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority เริ่มต้น (assignOrder)</label>
                            <input
                                type="number"
                                value={importForm.priorityStart}
                                onChange={(e) => setImportForm({ ...importForm, priorityStart: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                min={1}
                                placeholder="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">ลำดับความสำคัญในการ assign (เลขน้อย = assign ก่อน)</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <strong>Preview:</strong> {importForm.prefix}{importForm.start} - {importForm.prefix}{importForm.end}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                จำนวน: <strong>{Math.max(0, importForm.end - importForm.start + 1)}</strong> booth
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Priority: <strong>{importForm.priorityStart}</strong> - <strong>{importForm.priorityStart + Math.max(0, importForm.end - importForm.start)}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Zone จะเป็น <strong>UNDEFINED</strong> และจะถูกกำหนดอัตโนมัติเมื่อ assign ร้านตาม goodType
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Import History */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Info className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold">Booth ที่ Import แล้ว</h3>
                        </div>

                        <div className="border border-gray-200 rounded-lg max-h-[400px] overflow-y-auto">
                            {importedRanges.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    ยังไม่มี booth ที่ import
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {importedRanges.map((range, index) => (
                                        <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-gray-800">
                                                        {range.prefix}{range.start}
                                                    </span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="font-mono font-semibold text-gray-800">
                                                        {range.prefix}{range.end}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {range.count} booth{range.count > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {importedRanges.length > 0 && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                <strong>ทั้งหมด:</strong> {existingBooths.length} booth ใน {importedRanges.length} range{importedRanges.length > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importing ? 'กำลัง Import...' : 'Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
