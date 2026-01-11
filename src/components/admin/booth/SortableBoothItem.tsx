import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Utensils, Package, Settings, ArrowDown, RotateCcw } from 'lucide-react';
import { BoothResponse, BoothZone } from '@/services/admin/boothService';

interface SortableBoothItemProps {
    booth: BoothResponse;
    isConfigOrderMode: boolean;
    onBoothClick: (booth: BoothResponse) => void;
    isSelected?: boolean;
    onSelect?: (boothId: number, event: React.MouseEvent) => void;
    selectedCount?: number;
    // Context menu actions
    onMoveToPosition?: () => void;
    onReverseOrder?: () => void;
}

export function SortableBoothItem({
    booth,
    isConfigOrderMode,
    onBoothClick,
    isSelected = false,
    onSelect,
    selectedCount = 0,
    onMoveToPosition,
    onReverseOrder,
}: SortableBoothItemProps) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
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

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                onClick={(e) => {
                    // Only handle click if not clicking on the drag handle
                    if (isConfigOrderMode && onSelect && !(e.target as HTMLElement).closest('.drag-handle')) {
                        onSelect(booth.id, e);
                    }
                    // In normal mode, use context menu (right-click) for actions
                }}
                onContextMenu={handleContextMenu}
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
                {/* Assign Order - Top Right */}
                <div className="absolute top-1 right-1 text-[10px] text-gray-400 font-mono">
                    #{booth.assignOrder}
                </div>

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
                    <div className="absolute top-1 left-1 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold pointer-events-none">
                        ✓
                    </div>
                )}
                {isDragging && selectedCount > 1 && (
                    <div className="absolute -top-2 -left-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-white pointer-events-none">
                        {selectedCount}
                    </div>
                )}
                <div className="flex justify-center mb-1">
                    {getZoneIcon(booth.zone)}
                </div>
                <p className="font-bold text-gray-800">{booth.boothNumber}</p>

                {/* Store ID or Empty */}
                {booth.isAssigned && booth.assignment?.storeId ? (
                    <p className="text-xs text-gray-600 font-mono">
                        ID: {booth.assignment.storeId}
                    </p>
                ) : (
                    <p className="text-xs text-gray-400">-</p>
                )}

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

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isConfigOrderMode && isSelected ? (
                        <>
                            {/* Config Mode Options (when booth is selected) */}
                            {onMoveToPosition && (
                                <button
                                    onClick={() => {
                                        onMoveToPosition();
                                        setContextMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                    ย้ายไปยังลำดับที่...
                                </button>
                            )}
                            {selectedCount > 1 && onReverseOrder && (
                                <button
                                    onClick={() => {
                                        onReverseOrder();
                                        setContextMenu(null);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    กลับลำดับ ({selectedCount} รายการ)
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Normal Mode or Config Mode without selection */}
                            <button
                                onClick={() => {
                                    onBoothClick(booth);
                                    setContextMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                            >
                                <Settings className="w-4 h-4" />
                                Manual Assign
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
