'use client';

import React, { useState, useMemo } from 'react';
import { Trash2, Search, Filter, CheckSquare, Square, AlertTriangle, Save } from 'lucide-react';
import { BoothResponse, BoothZone } from '@/services/admin/boothService';
import { toast } from 'sonner';

interface BulkDeleteBoothsProps {
    booths: BoothResponse[];
    onDelete: (boothIds: number[]) => Promise<void>;
    onRefresh: () => Promise<void>; // Add refresh callback
    onClose: () => void;
}

export function BulkDeleteBooths({ booths, onDelete, onRefresh, onClose }: BulkDeleteBoothsProps) {
    // Track which booths are currently ACTIVE (checked = active, unchecked = will be disabled)
    const [activeBooths, setActiveBooths] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterZone, setFilterZone] = useState<'all' | BoothZone>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('unassigned');
    const [saving, setSaving] = useState(false);

    // Drag selection state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartId, setDragStartId] = useState<number | null>(null);

    // Initialize activeBooths with currently active booths
    React.useEffect(() => {
        const initialActive = new Set(
            booths.filter(b => b.isActive !== false && !b.isAssigned).map(b => b.id)
        );
        setActiveBooths(initialActive);
    }, [booths]);

    // Filter booths based on search and filters
    const filteredBooths = useMemo(() => {
        return booths.filter(booth => {
            // Search filter
            if (searchQuery && !booth.boothNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Zone filter
            if (filterZone !== 'all' && booth.zone !== filterZone) {
                return false;
            }

            // Status filter
            if (filterStatus === 'assigned' && !booth.isAssigned) {
                return false;
            }
            if (filterStatus === 'unassigned' && booth.isAssigned) {
                return false;
            }

            return true;
        });
    }, [booths, searchQuery, filterZone, filterStatus]);

    // Only show unassigned booths for editing
    const editableBooths = filteredBooths.filter(b => !b.isAssigned);

    const toggleBooth = (boothId: number) => {
        const newActive = new Set(activeBooths);
        if (newActive.has(boothId)) {
            newActive.delete(boothId);
        } else {
            newActive.add(boothId);
        }
        setActiveBooths(newActive);
    };

    const toggleAll = () => {
        if (activeBooths.size === editableBooths.length) {
            setActiveBooths(new Set());
        } else {
            setActiveBooths(new Set(editableBooths.map(b => b.id)));
        }
    };

    // Drag selection handlers
    const handleMouseDown = (boothId: number) => {
        setIsDragging(true);
        setDragStartId(boothId);
        toggleBooth(boothId);
    };

    const handleMouseEnter = (boothId: number) => {
        if (isDragging) {
            toggleBooth(boothId);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStartId(null);
    };

    // Add global mouse up listener
    React.useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
            setDragStartId(null);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);

            // Find booths that need to be disabled (unchecked but currently active)
            const boothsToDisable = editableBooths
                .filter(b => b.isActive !== false && !activeBooths.has(b.id))
                .map(b => b.id);

            // Find booths that need to be enabled (checked but currently disabled)
            const boothsToEnable = editableBooths
                .filter(b => b.isActive === false && activeBooths.has(b.id))
                .map(b => b.id);

            if (boothsToDisable.length === 0 && boothsToEnable.length === 0) {
                toast.info('ไม่มีการเปลี่ยนแปลง');
                setSaving(false);
                return;
            }

            // Call disable API if there are booths to disable
            if (boothsToDisable.length > 0) {
                await onDelete(boothsToDisable); // This will call bulkDisableBooths and refresh data
            }

            // Call enable API if there are booths to enable
            if (boothsToEnable.length > 0) {
                const { bulkEnableBooths } = await import('@/services/admin/boothService');
                await bulkEnableBooths(boothsToEnable);
                toast.success(`เปิดใช้งาน ${boothsToEnable.length} booth สำเร็จ`);
                // Refresh data after enable
                await onRefresh();
            }

            // Success message - modal stays open for further edits
            const messages = [];
            if (boothsToDisable.length > 0) messages.push(`ปิด ${boothsToDisable.length} booth`);
            if (boothsToEnable.length > 0) messages.push(`เปิด ${boothsToEnable.length} booth`);

            toast.success(`บันทึกสำเร็จ: ${messages.join(', ')}`);
        } catch (error) {
            console.error('Failed to save booth status:', error);
            // Don't close modal on error
        } finally {
            setSaving(false);
        }
    };

    const allSelected = editableBooths.length > 0 && activeBooths.size === editableBooths.length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Trash2 className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Bulk Disable Booths</h2>
                                <p className="text-sm text-gray-500">เลือกและปิดการใช้งาน booth ที่ไม่ต้องการพร้อมกัน</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหา booth..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        {/* Zone Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={filterZone}
                                onChange={(e) => setFilterZone(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none"
                            >
                                <option value="all">ทุก Zone</option>
                                <option value="FOOD">FOOD</option>
                                <option value="NON_FOOD">NON_FOOD</option>
                                <option value="UNDEFINED">UNDEFINED</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                            >
                                <option value="all">ทุกสถานะ</option>
                                <option value="unassigned">ว่าง (ปิดได้)</option>
                                <option value="assigned">ถูก Assign แล้ว</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                {editableBooths.length < filteredBooths.length && (
                    <div className="px-6 pt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <strong>หมายเหตุ:</strong> สามารถปิดการใช้งานได้เฉพาะ booth ที่ยังไม่ได้ assign เท่านั้น
                                ({editableBooths.length} จาก {filteredBooths.length} booth)
                            </div>
                        </div>
                    </div>
                )}

                {/* Booth List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {editableBooths.length === 0 ? (
                        <div className="text-center py-12">
                            <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">ไม่พบ booth ที่สามารถจัดการได้</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {filteredBooths.length > 0
                                    ? 'Booth ทั้งหมดถูก assign แล้ว'
                                    : 'ลองปรับเปลี่ยนตัวกรอง'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Select All */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <button
                                    onClick={toggleAll}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    {allSelected ? (
                                        <CheckSquare className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-400" />
                                    )}
                                    {allSelected ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                                </button>
                                <span className="text-sm text-gray-500">
                                    ({editableBooths.length} booths)
                                </span>
                                <span className="text-xs text-gray-400 ml-auto">
                                    💡 คลิกค้างแล้วลากเพื่อเลือกหลายอัน
                                </span>
                            </div>

                            {/* Booth Items */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {editableBooths.map((booth) => (
                                    <button
                                        key={booth.id}
                                        onMouseDown={() => handleMouseDown(booth.id)}
                                        onMouseEnter={() => handleMouseEnter(booth.id)}
                                        onMouseUp={handleMouseUp}
                                        className={`p-3 rounded-lg border-2 text-left transition-all select-none ${activeBooths.has(booth.id)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            } ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {activeBooths.has(booth.id) ? (
                                                <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-mono font-bold ${booth.isActive === false ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                        {booth.boothNumber}
                                                    </p>
                                                    {booth.isActive === false && (
                                                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                            ปิด
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5 mt-1">
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {booth.zone}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        Priority #{booth.assignOrder}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-600">
                            เปิดใช้งาน: <strong className="text-green-600">{activeBooths.size}</strong> / {editableBooths.length} booth(s)
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
