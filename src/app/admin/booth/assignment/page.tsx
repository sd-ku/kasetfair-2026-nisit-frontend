'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    getAllAssignments,
    getBoothStats,
    getLatestPendingAssignment,
    createAssignment,
    verifyAssignment,
    forfeitAssignment,
    BoothAssignmentResponse,
    BoothStatsResponse,
    BoothZone,
    BoothAssignmentStatus,
} from '@/services/admin/boothService';
import { QrCode, CheckCircle, XCircle, RefreshCw, AlertCircle, Utensils, Package, Scan, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function BoothAssignmentPage() {
    const [assignments, setAssignments] = useState<BoothAssignmentResponse[]>([]);
    const [stats, setStats] = useState<BoothStatsResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeZone, setActiveZone] = useState<BoothZone>('FOOD');
    const [latestPending, setLatestPending] = useState<BoothAssignmentResponse | null>(null);

    // Barcode scan state
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Manual assign state
    const [showManualAssignModal, setShowManualAssignModal] = useState(false);
    const [manualStoreId, setManualStoreId] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Filter state
    const [statusFilter, setStatusFilter] = useState<'all' | BoothAssignmentStatus>('all');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [assignmentsData, statsData, pendingData] = await Promise.all([
                getAllAssignments(activeZone),
                getBoothStats(),
                getLatestPendingAssignment(activeZone),
            ]);
            setAssignments(assignmentsData);
            setStats(statsData);
            setLatestPending(pendingData);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    }, [activeZone]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-focus barcode input
    useEffect(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [latestPending]);

    const handleScan = async () => {
        if (!barcode.trim()) {
            toast.error('กรุณาสแกนบาร์โค้ด');
            return;
        }

        if (!latestPending) {
            toast.error('ไม่มี assignment ที่รอยืนยัน');
            return;
        }

        try {
            setScanning(true);
            const result = await verifyAssignment({
                barcode: barcode.trim(),
                assignmentId: latestPending.id,
            });

            toast.success(`ยืนยันสำเร็จ! ร้าน "${result.store?.storeName}" ได้รับ Booth ${result.booth.boothNumber}`);
            setBarcode('');
            fetchData();
        } catch (error: any) {
            console.error('Failed to verify', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยัน';
            toast.error(errorMessage);
        } finally {
            setScanning(false);
            // Re-focus input
            if (barcodeInputRef.current) {
                barcodeInputRef.current.focus();
            }
        }
    };

    const handleForfeit = async (assignmentId: number, storeName: string) => {
        const reason = prompt(`กรุณาระบุเหตุผลที่ร้าน "${storeName}" สละสิทธิ์:`);
        if (reason === null) return; // User cancelled

        try {
            await forfeitAssignment({ assignmentId, reason });
            toast.success(`ร้าน "${storeName}" สละสิทธิ์แล้ว`);
            fetchData();
        } catch (error: any) {
            console.error('Failed to forfeit', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการสละสิทธิ์';
            toast.error(errorMessage);
        }
    };

    const handleManualAssign = async () => {
        const storeId = parseInt(manualStoreId);
        if (isNaN(storeId) || storeId <= 0) {
            toast.error('กรุณาระบุ Store ID ที่ถูกต้อง');
            return;
        }

        try {
            setAssigning(true);
            const result = await createAssignment({ storeId });
            toast.success(`สร้าง Assignment สำเร็จ! ร้าน ID ${storeId} ได้รับ Booth ${result.booth.boothNumber}`);
            setShowManualAssignModal(false);
            setManualStoreId('');
            fetchData();
        } catch (error: any) {
            console.error('Failed to assign', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้าง assignment';
            toast.error(errorMessage);
        } finally {
            setAssigning(false);
        }
    };

    // Handle Enter key on barcode input
    const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleScan();
        }
    };

    const getStatsByZone = (zone: BoothZone) => {
        return stats.find(s => s.zone === zone);
    };

    const getStatusBadge = (status: BoothAssignmentStatus) => {
        switch (status) {
            case 'CONFIRMED':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">✓ ยืนยันแล้ว</span>;
            case 'PENDING':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">⏳ รอยืนยัน</span>;
            case 'FORFEITED':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">✗ สละสิทธิ์</span>;
            default:
                return null;
        }
    };

    const filteredAssignments = statusFilter === 'all'
        ? assignments
        : assignments.filter(a => a.status === statusFilter);

    const currentZoneStats = getStatsByZone(activeZone);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <UserCheck className="w-8 h-8 text-purple-600" />
                        Booth Assignment
                    </h1>
                    <p className="text-gray-500 mt-1">จัดสรร booth และยืนยันตัวตน</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={() => setShowManualAssignModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <QrCode className="w-5 h-5" />
                        Manual Assign
                    </button>
                </div>
            </div>

            {/* Zone Selector */}
            <div className="flex gap-4">
                <button
                    onClick={() => setActiveZone('FOOD')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${activeZone === 'FOOD'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${activeZone === 'FOOD' ? 'bg-orange-500' : 'bg-gray-200'}`}>
                            <Utensils className={`w-6 h-6 ${activeZone === 'FOOD' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-800">โซนอาหาร (FOOD)</p>
                            <p className="text-sm text-gray-500">
                                {getStatsByZone('FOOD')?.confirmed || 0} / {getStatsByZone('FOOD')?.total || 0} confirmed
                            </p>
                        </div>
                    </div>
                </button>
                <button
                    onClick={() => setActiveZone('NON_FOOD')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${activeZone === 'NON_FOOD'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${activeZone === 'NON_FOOD' ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            <Package className={`w-6 h-6 ${activeZone === 'NON_FOOD' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-800">โซนไม่ใช่อาหาร (NON_FOOD)</p>
                            <p className="text-sm text-gray-500">
                                {getStatsByZone('NON_FOOD')?.confirmed || 0} / {getStatsByZone('NON_FOOD')?.total || 0} confirmed
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Pending Assignment Card */}
            {latestPending ? (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <h3 className="text-lg font-semibold text-yellow-800">รอยืนยันตัวตน</h3>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-bold text-gray-800">{latestPending.store?.storeName}</p>
                                <p className="text-gray-600">Booth: <strong className="text-2xl text-orange-600">{latestPending.booth.boothNumber}</strong></p>
                                <p className="text-sm text-gray-500">Draw Order: #{latestPending.drawOrder}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleForfeit(latestPending.id, latestPending.store?.storeName || '')}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            <XCircle className="w-5 h-5 inline-block mr-1" />
                            สละสิทธิ์
                        </button>
                    </div>

                    {/* Barcode Scanner */}
                    <div className="mt-6 p-4 bg-white rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                            <Scan className="w-5 h-5 text-gray-600" />
                            <label className="font-medium text-gray-700">สแกนบาร์โค้ดบัตรนิสิต</label>
                        </div>
                        <div className="flex gap-3">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                placeholder="สแกนบาร์โค้ดที่นี่... (เช่น 20065105035316)"
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-mono"
                                autoComplete="off"
                            />
                            <button
                                onClick={handleScan}
                                disabled={scanning || !barcode.trim()}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {scanning ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-5 h-5" />
                                )}
                                ยืนยัน
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            * สแกนบาร์โค้ดจากบัตรนิสิตแล้วกด Enter หรือคลิกปุ่มยืนยัน
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">ไม่มี assignment ที่รอยืนยัน</p>
                    <p className="text-gray-500 text-sm mt-1">สุ่มวงล้อเพื่อเพิ่ม assignment ใหม่</p>
                </div>
            )}

            {/* Filter & Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Filter */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">รายการ Assignment ({filteredAssignments.length})</h3>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="PENDING">รอยืนยัน</option>
                            <option value="CONFIRMED">ยืนยันแล้ว</option>
                            <option value="FORFEITED">สละสิทธิ์</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Booth</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ร้าน</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ยืนยันโดย</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">เวลา</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">กำลังโหลด...</p>
                                    </td>
                                </tr>
                            ) : filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        ไม่มีข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-600 font-mono">#{assignment.drawOrder}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-bold text-gray-800">{assignment.booth.boothNumber}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">{assignment.store?.storeName}</p>
                                            <p className="text-xs text-gray-500">ID: {assignment.storeId}</p>
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(assignment.status)}</td>
                                        <td className="px-4 py-3">
                                            {assignment.verifiedByNisitId ? (
                                                <span className="text-sm text-gray-600 font-mono">{assignment.verifiedByNisitId}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {assignment.verifiedAt
                                                ? new Date(assignment.verifiedAt).toLocaleString('th-TH', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    day: '2-digit',
                                                    month: 'short',
                                                })
                                                : new Date(assignment.createdAt).toLocaleString('th-TH', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    day: '2-digit',
                                                    month: 'short',
                                                })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {assignment.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleForfeit(assignment.id, assignment.store?.storeName || '')}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    สละสิทธิ์
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Assign Modal */}
            {showManualAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Manual Assign</h2>
                        <p className="text-gray-600 text-sm mb-4">
                            ใช้สำหรับ assign booth ให้ร้านโดยตรง (ไม่ผ่านการสุ่ม)
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                                <input
                                    type="number"
                                    value={manualStoreId}
                                    onChange={(e) => setManualStoreId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="เช่น 123"
                                    min={1}
                                />
                            </div>

                            <div className="bg-yellow-50 p-3 rounded-lg">
                                <p className="text-sm text-yellow-700">
                                    ⚠️ ร้านจะได้ booth ถัดไปตาม zone ของร้าน (ขึ้นอยู่กับ goodType)
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowManualAssignModal(false);
                                    setManualStoreId('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleManualAssign}
                                disabled={assigning || !manualStoreId}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {assigning ? 'กำลัง Assign...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
