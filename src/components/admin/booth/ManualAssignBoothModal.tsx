'use client';

import React, { useState, useEffect } from 'react';
import { assignSpecificBooth, BoothResponse } from '@/services/admin/boothService';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface ManualAssignBoothModalProps {
    isOpen: boolean;
    booth: BoothResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function ManualAssignBoothModal({
    isOpen,
    booth,
    onClose,
    onSuccess,
}: ManualAssignBoothModalProps) {
    const [storeId, setStoreId] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Pre-fill storeId if booth is already assigned
    useEffect(() => {
        if (booth?.isAssigned && booth.assignment?.storeId) {
            setStoreId(booth.assignment.storeId.toString());
        } else {
            setStoreId('');
        }
    }, [booth]);

    if (!isOpen || !booth) return null;

    const isReadOnly = booth.isAssigned && !!booth.assignment?.storeId;
    const boothNumber = booth.boothNumber;

    const handleAssign = async () => {
        const parsedStoreId = parseInt(storeId);
        if (isNaN(parsedStoreId) || parsedStoreId <= 0) {
            toast.error('กรุณาระบุ Store ID ที่ถูกต้อง');
            return;
        }

        try {
            setAssigning(true);
            const result = await assignSpecificBooth({
                storeId: parsedStoreId,
                boothNumber: boothNumber.toUpperCase(),
            });
            toast.success(`สร้าง Assignment สำเร็จ! ร้าน ID ${parsedStoreId} ได้รับ Booth ${result.booth.boothNumber}`);
            setStoreId('');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to assign booth', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้าง assignment';
            toast.error(errorMessage);
        } finally {
            setAssigning(false);
        }
    };

    const handleClose = () => {
        setStoreId('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Manual Assign Booth</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                    Assign booth <span className="font-bold text-purple-600">{boothNumber}</span> ให้ร้านโดยตรง
                </p>

                <div className="space-y-4">
                    {/* Booth Number (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลข Booth</label>
                        <input
                            type="text"
                            value={boothNumber}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono uppercase font-bold text-purple-600"
                        />
                    </div>

                    {/* Store ID Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Store ID
                            {isReadOnly && (
                                <span className="ml-2 text-xs text-orange-600">(Booth นี้มีร้านอยู่แล้ว)</span>
                            )}
                        </label>
                        <input
                            type="number"
                            value={storeId}
                            onChange={(e) => setStoreId(e.target.value)}
                            readOnly={isReadOnly}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isReadOnly
                                    ? 'bg-gray-50 cursor-not-allowed text-gray-700 font-semibold'
                                    : 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                }`}
                            placeholder="เช่น 123"
                            min={1}
                            autoFocus={!isReadOnly}
                        />
                        {isReadOnly && booth.assignment?.store && (
                            <p className="text-xs text-gray-600 mt-1">
                                ร้าน: <span className="font-semibold">{booth.assignment.store.storeName}</span>
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="p-3 rounded-lg bg-yellow-50">
                        <p className="text-sm text-yellow-700">
                            ✍️ คุณกำลัง assign booth <span className="font-bold">{boothNumber}</span> ให้กับร้านที่ระบุ
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={assigning || !storeId}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {assigning ? 'กำลัง Assign...' : 'Assign'}
                    </button>
                </div>
            </div>
        </div>
    );
}
