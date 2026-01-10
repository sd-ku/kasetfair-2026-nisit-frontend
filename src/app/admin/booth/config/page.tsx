'use client';

import React, { useEffect, useState } from 'react';
import { getAllBooths, updateBoothOrder } from '@/services/admin/boothService';
import { Settings, Save, RotateCcw, ArrowUp, ArrowDown, Utensils, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Booth {
    id: number;
    boothNumber: string;
    zone: 'FOOD' | 'NON_FOOD' | 'UNDEFINED';
    assignOrder: number;
    isAssigned: boolean;
}

export default function BoothConfigPage() {
    const [foodBooths, setFoodBooths] = useState<Booth[]>([]);
    const [nonFoodBooths, setNonFoodBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeZone, setActiveZone] = useState<'FOOD' | 'NON_FOOD'>('FOOD');

    const fetchBooths = async () => {
        try {
            setLoading(true);
            const allBooths = await getAllBooths();

            const food = allBooths.filter(b => b.zone === 'FOOD').sort((a, b) => a.assignOrder - b.assignOrder);
            const nonFood = allBooths.filter(b => b.zone === 'NON_FOOD').sort((a, b) => a.assignOrder - b.assignOrder);

            setFoodBooths(food);
            setNonFoodBooths(nonFood);
        } catch (error) {
            console.error('Failed to fetch booths', error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล booth');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooths();
    }, []);

    const currentBooths = activeZone === 'FOOD' ? foodBooths : nonFoodBooths;
    const setCurrentBooths = activeZone === 'FOOD' ? setFoodBooths : setNonFoodBooths;

    const moveBoothUp = (index: number) => {
        if (index === 0) return;

        const newBooths = [...currentBooths];
        [newBooths[index], newBooths[index - 1]] = [newBooths[index - 1], newBooths[index]];

        // Update assignOrder
        newBooths.forEach((booth, i) => {
            booth.assignOrder = i + 1;
        });

        setCurrentBooths(newBooths);
    };

    const moveBoothDown = (index: number) => {
        if (index === currentBooths.length - 1) return;

        const newBooths = [...currentBooths];
        [newBooths[index], newBooths[index + 1]] = [newBooths[index + 1], newBooths[index]];

        // Update assignOrder
        newBooths.forEach((booth, i) => {
            booth.assignOrder = i + 1;
        });

        setCurrentBooths(newBooths);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Combine both zones
            const allBooths = [...foodBooths, ...nonFoodBooths];

            // Call API to update booth orders
            await updateBoothOrder(allBooths.map(b => ({
                id: b.id,
                assignOrder: b.assignOrder
            })));

            toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
            fetchBooths();
        } catch (error: any) {
            console.error('Failed to save booth order', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('คุณต้องการรีเซ็ตการตั้งค่ากลับไปเป็นค่าเดิมหรือไม่?')) {
            fetchBooths();
            toast.info('รีเซ็ตการตั้งค่าแล้ว');
        }
    };

    return (
        <div className="overflow-x-auto container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Settings className="w-8 h-8 text-purple-600" />
                        Booth Configuration
                    </h1>
                    <p className="text-gray-500 mt-1">กำหนดลำดับการ assign booth สำหรับแต่ละ zone</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                        รีเซ็ท
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">💡 วิธีการทำงาน</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>FOOD Zone</strong>: จะ assign booth จากลำดับที่ 1 → 2 → 3 ... (จากบนลงล่าง)</li>
                    <li>• <strong>NON-FOOD Zone</strong>: จะ assign booth จากลำดับที่สูงสุด → ต่ำลง (จากล่างขึ้นบน)</li>
                    <li>• ใช้ปุ่มลูกศรเพื่อเปลี่ยนลำดับ booth ตามที่ต้องการ</li>
                    <li>• Booth ที่ถูก assign แล้วจะแสดงด้วยสีเทา</li>
                </ul>
            </div>

            {/* Zone Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveZone('FOOD')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${activeZone === 'FOOD'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Utensils className="w-5 h-5" />
                    FOOD Zone ({foodBooths.length} booths)
                </button>
                <button
                    onClick={() => setActiveZone('NON_FOOD')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${activeZone === 'NON_FOOD'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Package className="w-5 h-5" />
                    NON-FOOD Zone ({nonFoodBooths.length} booths)
                </button>
            </div>

            {/* Booth List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">
                        {activeZone === 'FOOD' ? '🍔 FOOD Zone' : '📦 NON-FOOD Zone'} - ลำดับการ Assign
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {activeZone === 'FOOD'
                            ? 'Booth ที่อยู่บนสุดจะถูก assign ก่อน (ขยายจากบนลงล่าง)'
                            : 'Booth ที่อยู่ล่างสุดจะถูก assign ก่อน (ขยายจากล่างขึ้นบน)'
                        }
                    </p>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        กำลังโหลด...
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {currentBooths.map((booth, index) => (
                            <div
                                key={booth.id}
                                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${booth.isAssigned ? 'bg-gray-50 opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="text-center min-w-[60px]">
                                        <div className="text-xs text-gray-500 mb-1">ลำดับ</div>
                                        <div className="text-lg font-bold text-purple-600">
                                            #{booth.assignOrder}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold text-gray-800">
                                                {booth.boothNumber}
                                            </span>
                                            {booth.isAssigned && (
                                                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                                                    ถูก assign แล้ว
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Zone: {booth.zone}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => moveBoothUp(index)}
                                        disabled={index === 0}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="เลื่อนขึ้น"
                                    >
                                        <ArrowUp className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => moveBoothDown(index)}
                                        disabled={index === currentBooths.length - 1}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="เลื่อนลง"
                                    >
                                        <ArrowDown className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                        <Utensils className="w-5 h-5" />
                        FOOD Zone
                    </h4>
                    <div className="space-y-1 text-sm text-orange-700">
                        <p>• จำนวน booth: <strong>{foodBooths.length}</strong></p>
                        <p>• Booth แรก: <strong>{foodBooths[0]?.boothNumber || '-'}</strong></p>
                        <p>• Booth สุดท้าย: <strong>{foodBooths[foodBooths.length - 1]?.boothNumber || '-'}</strong></p>
                        <p>• ถูก assign แล้ว: <strong>{foodBooths.filter(b => b.isAssigned).length}</strong> booth</p>
                    </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        NON-FOOD Zone
                    </h4>
                    <div className="space-y-1 text-sm text-blue-700">
                        <p>• จำนวน booth: <strong>{nonFoodBooths.length}</strong></p>
                        <p>• Booth แรก (assign ล่าสุด): <strong>{nonFoodBooths[nonFoodBooths.length - 1]?.boothNumber || '-'}</strong></p>
                        <p>• Booth สุดท้าย (assign ก่อน): <strong>{nonFoodBooths[0]?.boothNumber || '-'}</strong></p>
                        <p>• ถูก assign แล้ว: <strong>{nonFoodBooths.filter(b => b.isAssigned).length}</strong> booth</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
