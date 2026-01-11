'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    getAllBooths,
    getBoothStats,
    importBoothRange,
    deleteAllBooths,
    bulkDisableBooths,
    updateBoothOrder,
    getLastPriority,
    BoothResponse,
    BoothStatsResponse,
    BoothZone,
} from '@/services/admin/boothService';
import { Plus, Trash2, RefreshCw, MapPin, Utensils, Package, LayoutGrid, Settings, Save, RotateCcw as ResetIcon, ArrowUp, ArrowDown, GripVertical, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ZoneMMap } from '@/components/admin/booth/ZoneMMap';
import { ImportBoothModal, ImportFormData } from '@/components/admin/booth/ImportBoothModal';
import { BulkDeleteBooths } from '@/components/admin/booth/BulkDeleteBooths';
import { SortableBoothItem } from '@/components/admin/booth/SortableBoothItem';

export default function BoothManagementPage() {
    const [booths, setBooths] = useState<BoothResponse[]>([]);
    const [stats, setStats] = useState<BoothStatsResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | BoothZone>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [isConfigOrderMode, setIsConfigOrderMode] = useState(false);

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [initialPriorityStart, setInitialPriorityStart] = useState(1);

    // Bulk delete modal state
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Multi-selection state for config order mode
    const [selectedBoothIds, setSelectedBoothIds] = useState<Set<number>>(new Set());
    const [lastSelectedBoothId, setLastSelectedBoothId] = useState<number | null>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; boothId: number } | null>(null);
    const [showMoveToPositionModal, setShowMoveToPositionModal] = useState(false);
    const [targetPosition, setTargetPosition] = useState<string>('');

    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [boothsData, statsData, lastPriorityData] = await Promise.all([
                getAllBooths(),
                getBoothStats(),
                getLastPriority(),
            ]);
            setBooths(boothsData);
            setStats(statsData);

            // อัปเดต priorityStart ให้เป็นค่าถัดไปจากค่าล่าสุด
            const nextPriority = (lastPriorityData.lastPriority || 0) + 1;
            setInitialPriorityStart(nextPriority);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    const handleImport = async (formData: ImportFormData) => {
        try {
            const result = await importBoothRange({
                ranges: [{
                    prefix: formData.prefix,
                    start: formData.start,
                    end: formData.end,
                    // ไม่ส่ง zone เพื่อให้ backend กำหนดเป็น UNDEFINED
                    // zone จะถูกกำหนดอัตโนมัติตอน assign ร้านตาม goodType
                    priorityStart: formData.priorityStart,
                }],
            });
            toast.success(result.message);
            await fetchData();
        } catch (error: any) {
            console.error('Failed to import booths', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการ import booth';
            toast.error(errorMessage);
            throw error; // Re-throw to let modal handle the error state
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ booth ทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            return;
        }

        try {
            const result = await deleteAllBooths();
            toast.success(result.message);
            fetchData();
        } catch (error: any) {
            console.error('Failed to delete booths', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ booth';
            toast.error(errorMessage);
        }
    };

    const handleBulkDisable = async (boothIds: number[]) => {
        try {
            const result = await bulkDisableBooths(boothIds);
            toast.success(result.message);
            await fetchData();
        } catch (error: any) {
            console.error('Failed to disable booths', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการปิดการใช้งาน booth';
            toast.error(errorMessage);
            throw error;
        }
    };

    const handleBoothClick = (booth: BoothResponse) => {
        if (booth.isAssigned) {
            toast.info(`Booth ${booth.boothNumber} is assigned to ${booth.assignment?.store?.storeName} (${booth.assignment?.status})`);
        } else {
            toast.info(`Booth ${booth.boothNumber} is available. Click 'Import Booth' or use Lucky Draw to assign.`);
            // In a real scenario, this could open a manual assignment modal
        }
    };

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        })
    );

    // Drag and drop handler for config order mode
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const draggedId = parseInt(active.id.toString());
        const overId = parseInt(over.id.toString());

        // Check if dragged item is part of selection
        const isDraggingSelected = selectedBoothIds.has(draggedId);
        const boothsToMove = isDraggingSelected
            ? Array.from(selectedBoothIds)
            : [draggedId];

        const oldIndex = filteredBooths.findIndex((booth) => booth.id === draggedId);
        const newIndex = filteredBooths.findIndex((booth) => booth.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        // Create a copy of filtered booths
        let reorderedBooths = [...filteredBooths];

        if (boothsToMove.length === 1) {
            // Single item drag
            reorderedBooths = arrayMove(reorderedBooths, oldIndex, newIndex);
        } else {
            // Multi-item drag
            // 1. Extract selected booths in their current order
            const selectedBooths = reorderedBooths.filter(b => boothsToMove.includes(b.id));
            // 2. Remove selected booths from array
            reorderedBooths = reorderedBooths.filter(b => !boothsToMove.includes(b.id));

            // 3. Find the new insertion index (accounting for removed items)
            let insertIndex = newIndex;
            // Adjust insert index based on how many selected items were before the target
            const selectedBeforeTarget = selectedBooths.filter((_, idx) => {
                const originalIdx = filteredBooths.findIndex(b => b.id === selectedBooths[idx].id);
                return originalIdx < newIndex;
            }).length;
            insertIndex = newIndex - selectedBeforeTarget;

            // 4. Insert all selected booths at the new position
            reorderedBooths.splice(insertIndex, 0, ...selectedBooths);
        }

        // Update assignOrder for all reordered booths
        reorderedBooths.forEach((booth, index) => {
            booth.assignOrder = index + 1;
        });

        // Create a map of reordered booth IDs for quick lookup
        const reorderedBoothIds = new Set(reorderedBooths.map(b => b.id));

        // Separate booths into reordered and non-reordered
        const nonReorderedBooths = booths.filter(b => !reorderedBoothIds.has(b.id));

        // Combine: put reordered booths first (in new order), then non-reordered booths
        const updatedBooths = [...reorderedBooths, ...nonReorderedBooths];

        setBooths(updatedBooths);
    };

    // Multi-selection handler
    const handleBoothSelection = (boothId: number, event: React.MouseEvent) => {
        if (!isConfigOrderMode) return;

        const newSelection = new Set(selectedBoothIds);

        if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + Click: Toggle selection
            if (newSelection.has(boothId)) {
                newSelection.delete(boothId);
                // If we're deselecting the last selected booth, clear lastSelectedBoothId
                if (lastSelectedBoothId === boothId) {
                    setLastSelectedBoothId(newSelection.size > 0 ? Array.from(newSelection)[0] : null);
                }
            } else {
                newSelection.add(boothId);
                setLastSelectedBoothId(boothId);
            }
        } else if (event.shiftKey && lastSelectedBoothId !== null) {
            // Shift + Click: Select range from last selected booth to current booth
            const boothIds = filteredBooths.map(b => b.id);
            const lastIndex = boothIds.indexOf(lastSelectedBoothId);
            const currentIndex = boothIds.indexOf(boothId);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);

                // Add all booths in the range
                for (let i = start; i <= end; i++) {
                    newSelection.add(boothIds[i]);
                }
            }
            // Don't update lastSelectedBoothId on Shift+Click, keep it for next range selection
        } else {
            // Regular click: Select only this booth
            newSelection.clear();
            newSelection.add(boothId);
            setLastSelectedBoothId(boothId);
        }

        setSelectedBoothIds(newSelection);
    };

    const handleToggleConfigOrder = () => {
        if (isConfigOrderMode) {
            // Exiting config mode - ask to save
            if (confirm('คุณต้องการบันทึกการเปลี่ยนแปลงหรือไม่?')) {
                handleSaveConfigOrder();
            } else {
                fetchData(); // Reset to original
            }
        }
        setIsConfigOrderMode(!isConfigOrderMode);
        setSelectedBoothIds(new Set()); // Clear selection when toggling
        setLastSelectedBoothId(null); // Clear last selected booth ID
    };

    // Context menu handlers
    const handleContextMenu = (e: React.MouseEvent, boothId: number) => {
        if (!isConfigOrderMode || selectedBoothIds.size === 0) return;

        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, boothId });
    };

    const handleMoveToPosition = () => {
        setContextMenu(null);
        setShowMoveToPositionModal(true);
    };

    const handleConfirmMoveToPosition = () => {
        const position = parseInt(targetPosition);
        if (isNaN(position) || position < 1 || position > filteredBooths.length) {
            toast.error('กรุณาใส่ลำดับที่ถูกต้อง (1-' + filteredBooths.length + ')');
            return;
        }

        // Get selected booths in current order
        const selectedBooths = filteredBooths.filter(b => selectedBoothIds.has(b.id));
        const nonSelectedBooths = filteredBooths.filter(b => !selectedBoothIds.has(b.id));

        // Insert at target position (convert to 0-based index)
        const insertIndex = position - 1;
        const reorderedBooths = [...nonSelectedBooths];
        reorderedBooths.splice(insertIndex, 0, ...selectedBooths);

        // Update assignOrder
        reorderedBooths.forEach((booth, index) => {
            booth.assignOrder = index + 1;
        });

        // Update state
        const reorderedBoothIds = new Set(reorderedBooths.map(b => b.id));
        const otherBooths = booths.filter(b => !reorderedBoothIds.has(b.id));
        setBooths([...reorderedBooths, ...otherBooths]);

        setShowMoveToPositionModal(false);
        setTargetPosition('');
        toast.success(`ย้าย ${selectedBooths.length} Booth ไปยังลำดับที่ ${position}`);
    };

    const handleReverseOrder = () => {
        if (selectedBoothIds.size < 2) {
            toast.error('กรุณาเลือก Booth อย่างน้อย 2 อันเพื่อกลับลำดับ');
            return;
        }

        // Get selected booths in current order
        const selectedBooths = filteredBooths.filter(b => selectedBoothIds.has(b.id));
        const reversedSelectedBooths = [...selectedBooths].reverse();

        // Create new array with reversed selection
        let reorderedBooths = [...filteredBooths];

        // Find indices of selected booths
        const selectedIndices = selectedBooths.map(booth =>
            filteredBooths.findIndex(b => b.id === booth.id)
        );

        // Replace selected booths with reversed ones at their positions
        selectedIndices.forEach((index, i) => {
            reorderedBooths[index] = reversedSelectedBooths[i];
        });

        // Update assignOrder
        reorderedBooths.forEach((booth, index) => {
            booth.assignOrder = index + 1;
        });

        // Update state
        const reorderedBoothIds = new Set(reorderedBooths.map(b => b.id));
        const otherBooths = booths.filter(b => !reorderedBoothIds.has(b.id));
        setBooths([...reorderedBooths, ...otherBooths]);

        setContextMenu(null);
        toast.success(`กลับลำดับ ${selectedBooths.length} Booth แล้ว`);
    };

    const handleSaveConfigOrder = async () => {
        try {
            setSaving(true);

            await updateBoothOrder(booths.map(b => ({
                id: b.id,
                assignOrder: b.assignOrder
            })));

            toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
            setIsConfigOrderMode(false);
            fetchData();
        } catch (error: any) {
            console.error('Failed to save booth order', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const filteredBooths = activeTab === 'all'
        ? booths
        : booths.filter(b => b.zone === activeTab);

    const getZoneIcon = (zone: BoothZone) => {
        return zone === 'FOOD'
            ? <Utensils className="w-4 h-4 text-orange-500" />
            : <Package className="w-4 h-4 text-blue-500" />;
    };

    const getZoneLabel = (zone: BoothZone) => {
        return zone === 'FOOD' ? 'อาหาร' : 'ไม่ใช่อาหาร';
    };

    const getStatsByZone = (zone: BoothZone) => {
        return stats.find(s => s.zone === zone);
    };

    return (
        <div className="container overflow-x-auto mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <MapPin className="w-8 h-8 text-green-600" />
                        Booth Management
                    </h1>
                    <p className="text-gray-500 mt-1">จัดการ booth และติดตามการจัดสรร</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                    {activeTab === 'all' && viewMode === 'grid' && (
                        <button
                            onClick={handleToggleConfigOrder}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isConfigOrderMode
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                }`}
                        >
                            <Settings className="w-5 h-5" />
                            {isConfigOrderMode ? 'ออกจากโหมดจัดลำดับ' : 'Config Order'}
                        </button>
                    )}
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Import Booth
                    </button>
                    <button
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        Bulk Delete
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        ลบทั้งหมด
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Food Zone Stats */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-500 rounded-xl">
                            <Utensils className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">โซนอาหาร (FOOD)</h3>
                            <p className="text-sm text-gray-500">booth สำหรับร้านอาหาร</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-orange-600">{getStatsByZone('FOOD')?.total || 0}</p>
                            <p className="text-xs text-gray-500">ทั้งหมด</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{getStatsByZone('FOOD')?.confirmed || 0}</p>
                            <p className="text-xs text-gray-500">ยืนยันแล้ว</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{getStatsByZone('FOOD')?.available || 0}</p>
                            <p className="text-xs text-gray-500">ว่าง</p>
                        </div>
                    </div>
                </div>

                {/* Non-Food Zone Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500 rounded-xl">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">โซนไม่ใช่อาหาร (NON_FOOD)</h3>
                            <p className="text-sm text-gray-500">booth สำหรับร้านขายของ</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{getStatsByZone('NON_FOOD')?.total || 0}</p>
                            <p className="text-xs text-gray-500">ทั้งหมด</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{getStatsByZone('NON_FOOD')?.confirmed || 0}</p>
                            <p className="text-xs text-gray-500">ยืนยันแล้ว</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{getStatsByZone('NON_FOOD')?.available || 0}</p>
                            <p className="text-xs text-gray-500">ว่าง</p>
                        </div>
                    </div>
                </div>

                {/* Undefined Zone Stats */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gray-500 rounded-xl">
                            <LayoutGrid className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">ยังไม่กำหนด (UNDEFINED)</h3>
                            <p className="text-sm text-gray-500">booth ที่รอ assign</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-600">{getStatsByZone('UNDEFINED')?.total || 0}</p>
                            <p className="text-xs text-gray-500">ทั้งหมด</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{getStatsByZone('UNDEFINED')?.confirmed || 0}</p>
                            <p className="text-xs text-gray-500">ยืนยันแล้ว</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{getStatsByZone('UNDEFINED')?.available || 0}</p>
                            <p className="text-xs text-gray-500">ว่าง</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Toggle & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'all'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        ทั้งหมด ({booths.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('FOOD')}
                        className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'FOOD'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Utensils className="w-4 h-4" />
                        FOOD ({booths.filter(b => b.zone === 'FOOD').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('NON_FOOD')}
                        className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'NON_FOOD'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        NON_FOOD ({booths.filter(b => b.zone === 'NON_FOOD').length})
                    </button>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'map'
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <MapPin className="w-4 h-4" />
                        Map View
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'grid'
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Grid View
                    </button>
                </div>
            </div>

            {/* Booth Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                {/* Config Order Mode Banner */}
                {isConfigOrderMode && activeTab === 'all' && viewMode === 'grid' && (
                    <div className="mb-6 bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                    <GripVertical className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-purple-900">
                                        โหมดจัดลำดับ Booth
                                        {selectedBoothIds.size > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                                เลือก {selectedBoothIds.size} รายการ
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-sm text-purple-700">
                                        {selectedBoothIds.size > 0
                                            ? 'ลาก Booth ที่เลือกเพื่อเปลี่ยนลำดับ | คลิกที่ว่างเพื่อยกเลิกการเลือก'
                                            : 'คลิก: เลือก 1 รายการ | Ctrl+คลิก: เลือกหลายรายการ | Shift+คลิก: เลือกช่วง | ลาก: เปลี่ยนลำดับ'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        fetchData();
                                        setIsConfigOrderMode(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    <ResetIcon className="w-5 h-5" />
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleSaveConfigOrder}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">กำลังโหลด...</p>
                    </div>
                ) : booths.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">ยังไม่มี booth</p>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="mt-4 text-green-600 hover:underline"
                        >
                            + Import Booth
                        </button>
                    </div>
                ) : viewMode === 'map' ? (
                    <ZoneMMap booths={booths} onBoothClick={handleBoothClick} />
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={filteredBooths.map(b => b.id.toString())}
                            strategy={rectSortingStrategy}
                            disabled={!isConfigOrderMode}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                                {filteredBooths.map((booth) => (
                                    <SortableBoothItem
                                        key={booth.id}
                                        booth={booth}
                                        isConfigOrderMode={isConfigOrderMode}
                                        onBoothClick={handleBoothClick}
                                        isSelected={selectedBoothIds.has(booth.id)}
                                        onSelect={handleBoothSelection}
                                        selectedCount={selectedBoothIds.size}
                                        onContextMenu={handleContextMenu}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Import Modal */}
            <ImportBoothModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
                initialPriorityStart={initialPriorityStart}
                existingBooths={booths}
            />

            {/* Bulk Delete Modal */}
            {
                showBulkDeleteModal && (
                    <BulkDeleteBooths
                        booths={booths}
                        onDelete={handleBulkDisable}
                        onRefresh={fetchData}
                        onClose={() => setShowBulkDeleteModal(false)}
                    />
                )
            }

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleMoveToPosition}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                    >
                        <ArrowDown className="w-4 h-4" />
                        ย้ายไปยังลำดับที่...
                    </button>
                    {selectedBoothIds.size > 1 && (
                        <button
                            onClick={handleReverseOrder}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            กลับลำดับ ({selectedBoothIds.size} รายการ)
                        </button>
                    )}
                </div>
            )}

            {/* Move to Position Modal */}
            {showMoveToPositionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">ย้ายไปยังลำดับที่</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            เลือก {selectedBoothIds.size} Booth จะถูกย้ายไปวางต่อท้ายลำดับที่ระบุ
                        </p>
                        <input
                            type="number"
                            min="1"
                            max={filteredBooths.length}
                            value={targetPosition}
                            onChange={(e) => setTargetPosition(e.target.value)}
                            placeholder={`ใส่ลำดับ (1-${filteredBooths.length})`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmMoveToPosition();
                                if (e.key === 'Escape') {
                                    setShowMoveToPositionModal(false);
                                    setTargetPosition('');
                                }
                            }}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowMoveToPositionModal(false);
                                    setTargetPosition('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmMoveToPosition}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
