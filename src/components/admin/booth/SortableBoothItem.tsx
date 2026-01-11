import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Utensils, Package } from 'lucide-react';
import { BoothResponse, BoothZone } from '@/services/admin/boothService';

interface SortableBoothItemProps {
    booth: BoothResponse;
    isConfigOrderMode: boolean;
    onBoothClick: (booth: BoothResponse) => void;
    isSelected?: boolean;
    onSelect?: (boothId: number, event: React.MouseEvent) => void;
    selectedCount?: number;
    onContextMenu?: (e: React.MouseEvent, boothId: number) => void;
}

export function SortableBoothItem({ booth, isConfigOrderMode, onBoothClick, isSelected = false, onSelect, selectedCount = 0, onContextMenu }: SortableBoothItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: booth.id.toString(),
        disabled: !isConfigOrderMode,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getZoneIcon = (zone: BoothZone) => {
        return zone === 'FOOD'
            ? <Utensils className="w-4 h-4 text-orange-500" />
            : <Package className="w-4 h-4 text-blue-500" />;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={(e) => {
                // Only handle click if not clicking on the drag handle
                if (isConfigOrderMode && onSelect && !(e.target as HTMLElement).closest('.drag-handle')) {
                    onSelect(booth.id, e);
                } else if (!isConfigOrderMode) {
                    onBoothClick(booth);
                }
            }}
            onContextMenu={(e) => {
                if (isConfigOrderMode && onContextMenu) {
                    onContextMenu(e, booth.id);
                }
            }}
            className={`relative p-3 rounded-xl border-2 text-center transition-all ${isConfigOrderMode
                ? 'cursor-pointer hover:shadow-lg'
                : 'cursor-pointer'
                } ${isSelected
                    ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300'
                    : isDragging
                        ? 'shadow-2xl scale-105 bg-purple-100 border-purple-400 z-50 opacity-50'
                        : booth.isAssigned
                            ? booth.assignment?.status === 'CONFIRMED'
                                ? 'bg-green-50 border-green-300'
                                : booth.assignment?.status === 'PENDING'
                                    ? 'bg-yellow-50 border-yellow-300'
                                    : 'bg-red-50 border-red-300'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                } ${!booth.isActive ? 'opacity-40 grayscale' : ''
                }`}
            title={
                isConfigOrderMode
                    ? isSelected
                        ? `Booth ${booth.boothNumber} (เลือกแล้ว)${!booth.isActive ? ' - ปิดการใช้งาน' : ''}`
                        : `คลิกเพื่อเลือก Booth ${booth.boothNumber} | Ctrl+Click: เลือกหลายอัน | Shift+Click: เลือกช่วง${!booth.isActive ? ' - ปิดการใช้งาน' : ''}`
                    : booth.isAssigned
                        ? `${booth.assignment?.store?.storeName || 'Unknown'} (${booth.assignment?.status})${!booth.isActive ? ' - ปิดการใช้งาน' : ''}`
                        : !booth.isActive ? 'ปิดการใช้งาน' : 'ว่าง'
            }
        >
            {isConfigOrderMode && (
                <div
                    className="drag-handle flex justify-center mb-1 cursor-move"
                    {...listeners}
                    title="ลากเพื่อเปลี่ยนลำดับ"
                >
                    <GripVertical className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-purple-500'}`} />
                </div>
            )}
            {isSelected && isConfigOrderMode && (
                <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold pointer-events-none">
                    ✓
                </div>
            )}
            {isDragging && selectedCount > 1 && (
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-white pointer-events-none">
                    {selectedCount}
                </div>
            )}
            <div className="flex justify-center mb-1">
                {getZoneIcon(booth.zone)}
            </div>
            <p className="font-bold text-gray-800">{booth.boothNumber}</p>
            <p className="text-xs text-gray-500">#{booth.assignOrder}</p>
            {!booth.isActive && (
                <p className="text-xs mt-1 px-2 py-0.5 bg-gray-600 text-white rounded-full inline-block">
                    ปิดใช้งาน
                </p>
            )}
            {booth.isAssigned && (
                <p
                    className={`text-xs mt-1 font-medium ${booth.assignment?.status === 'CONFIRMED'
                        ? 'text-green-600'
                        : booth.assignment?.status === 'PENDING'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                >
                    {booth.assignment?.status === 'CONFIRMED'
                        ? '✓'
                        : booth.assignment?.status === 'PENDING'
                            ? '⏳'
                            : '✗'}
                </p>
            )}
        </div>
    );
}
