'use client';

import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { RefreshCw, MapPin, GripVertical, Save, RotateCcw as ResetIcon } from 'lucide-react';
import { BoothResponse } from '@/services/admin/boothService';
import { SortableBoothItem } from './SortableBoothItem';
import { ZoneMMap } from './ZoneMMap';

interface BoothGridViewProps {
    booths: BoothResponse[];
    filteredBooths: BoothResponse[];
    loading: boolean;
    viewMode: 'grid' | 'map';
    activeTab: string;
    isConfigOrderMode: boolean;
    selectedBoothIds: Set<number>;
    saving: boolean;
    onBoothClick: (booth: BoothResponse) => void;
    onBoothSelection: (boothId: number, event: React.MouseEvent) => void;
    onMoveToPosition?: () => void;
    onReverseOrder?: () => void;
    onDragEnd: (event: DragEndEvent) => void;
    onSaveConfigOrder: () => void;
    onCancelConfigOrder: () => void;
    onShowImportModal: () => void;
}

export function BoothGridView({
    booths,
    filteredBooths,
    loading,
    viewMode,
    activeTab,
    isConfigOrderMode,
    selectedBoothIds,
    saving,
    onBoothClick,
    onBoothSelection,
    onMoveToPosition,
    onReverseOrder,
    onDragEnd,
    onSaveConfigOrder,
    onCancelConfigOrder,
    onShowImportModal,
}: BoothGridViewProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    return (
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
                                onClick={onCancelConfigOrder}
                                className="flex items-center gap-2 px-4 py-2 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <ResetIcon className="w-5 h-5" />
                                ยกเลิก
                            </button>
                            <button
                                onClick={onSaveConfigOrder}
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
                        onClick={onShowImportModal}
                        className="mt-4 text-green-600 hover:underline"
                    >
                        + Import Booth
                    </button>
                </div>
            ) : viewMode === 'map' ? (
                <ZoneMMap booths={booths} onBoothClick={onBoothClick} />
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
                                    onBoothClick={onBoothClick}
                                    isSelected={selectedBoothIds.has(booth.id)}
                                    onSelect={onBoothSelection}
                                    selectedCount={selectedBoothIds.size}
                                    onMoveToPosition={onMoveToPosition}
                                    onReverseOrder={onReverseOrder}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
