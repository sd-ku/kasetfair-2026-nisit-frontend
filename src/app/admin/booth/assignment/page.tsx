'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    getAllAssignments,
    getBoothStats,
    getLatestPendingAssignment,
    createAssignment,
    assignSpecificBooth,
    verifyAssignment,
    verifyByStoreId,
    forfeitAssignment,
    lookupStoreByBarcode,
    recoverDrawnStoresWithoutBooth,
    BoothAssignmentResponse,
    BoothStatsResponse,
    BoothZone,
    BoothAssignmentStatus,
    LookupStoreResponse,
    RecoverDrawnStoresResponse,
} from '@/services/admin/boothService';
import { QrCode, CheckCircle, XCircle, RefreshCw, AlertCircle, Utensils, Package, Scan, UserCheck, Search, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function BoothAssignmentPage() {
    const [assignments, setAssignments] = useState<BoothAssignmentResponse[]>([]);
    const [stats, setStats] = useState<BoothStatsResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeZone, setActiveZone] = useState<BoothZone | undefined>(undefined);
    const [latestPending, setLatestPending] = useState<BoothAssignmentResponse | null>(null);

    // Barcode scan state
    const [barcode, setBarcode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [lookupResult, setLookupResult] = useState<LookupStoreResponse | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Manual assign state
    const [showManualAssignModal, setShowManualAssignModal] = useState(false);
    const [manualStoreId, setManualStoreId] = useState('');
    const [manualBoothNumber, setManualBoothNumber] = useState('');
    const [assignMode, setAssignMode] = useState<'auto' | 'manual'>('auto'); // auto = ให้ระบบเลือก, manual = ระบุเอง
    const [assigning, setAssigning] = useState(false);

    // Filter state
    const [statusFilter, setStatusFilter] = useState<'all' | BoothAssignmentStatus>('all');

    // Recover state
    const [recovering, setRecovering] = useState(false);

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

    // Auto-focus barcode input and keep it focused
    useEffect(() => {
        const inputElement = barcodeInputRef.current;
        if (!inputElement) return;

        // Initial focus
        inputElement.focus();

        // Global keydown listener - refocus input when any key is pressed
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Don't interfere if user is typing in another input/textarea/select or if a modal is open
            const target = e.target as HTMLElement;
            const isTypingElsewhere = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

            // If not typing in another field, focus the barcode input
            if (!isTypingElsewhere && inputElement) {
                inputElement.focus();
            }
        };

        // Refocus when input loses focus (unless clicking on a button or other interactive element)
        const handleBlur = (e: FocusEvent) => {
            // Small delay to allow other elements to receive focus first
            setTimeout(() => {
                // Only refocus if no modal is open and not focusing on another input/textarea/select
                const activeElement = document.activeElement as HTMLElement;
                const isInputOrTextarea = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'SELECT';

                if (!isInputOrTextarea && inputElement && !showManualAssignModal) {
                    inputElement.focus();
                }
            }, 100);
        };

        // Add event listeners
        document.addEventListener('keydown', handleGlobalKeyDown);
        inputElement.addEventListener('blur', handleBlur);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
            inputElement.removeEventListener('blur', handleBlur);
        };
    }, [latestPending, showManualAssignModal]);

    // Auto-search when barcode reaches 14 characters
    useEffect(() => {
        if (barcode.trim().length === 14 && !scanning) {
            handleScan();
        }
    }, [barcode]);

    const handleScan = async () => {
        if (!barcode.trim()) {
            toast.error('กรุณาสแกนบาร์โค้ด');
            return;
        }

        try {
            setScanning(true);
            const result = await lookupStoreByBarcode(barcode.trim());

            setLookupResult(result);
            toast.success(`พบข้อมูล: ${result.nisit.firstName} ${result.nisit.lastName} - ร้าน "${result.store.storeName}"`);
            setBarcode('');
        } catch (error: any) {
            console.error('Failed to lookup store', error);
            const errorMessage = error?.response?.data?.message || 'ไม่พบข้อมูล';
            toast.error(errorMessage);
            setLookupResult(null);
        } finally {
            setScanning(false);
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

        if (assignMode === 'manual' && !manualBoothNumber.trim()) {
            toast.error('กรุณาระบุหมายเลข Booth');
            return;
        }

        try {
            setAssigning(true);

            if (assignMode === 'auto') {
                // Auto assign - ให้ระบบเลือก booth ถัดไป
                const result = await createAssignment({ storeId });
                toast.success(`สร้าง Assignment สำเร็จ! ร้าน ID ${storeId} ได้รับ Booth ${result.booth.boothNumber}`);
            } else {
                // Manual assign - ระบุหมายเลข booth เอง
                const result = await assignSpecificBooth({
                    storeId,
                    boothNumber: manualBoothNumber.trim().toUpperCase()
                });
                toast.success(`สร้าง Assignment สำเร็จ! ร้าน ID ${storeId} ได้รับ Booth ${result.booth.boothNumber}`);
            }

            setShowManualAssignModal(false);
            setManualStoreId('');
            setManualBoothNumber('');
            setAssignMode('auto');
            setLookupResult(null); // Clear lookup result if exists
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

    const handleRecoverDrawnStores = async () => {
        if (!confirm('คุณต้องการ recover และ assign booth ให้ร้านที่ถูกสุ่มไปแล้วแต่ยังไม่มี booth หรือไม่?')) {
            return;
        }

        try {
            setRecovering(true);
            const result = await recoverDrawnStoresWithoutBooth();

            if (result.recovered > 0) {
                toast.success(`✅ Recover สำเร็จ! จัดสรร booth ให้ ${result.recovered} ร้าน`);
            } else {
                toast.info('ℹ️ ไม่พบร้านที่ต้อง recover');
            }

            fetchData(); // Refresh data
        } catch (error: any) {
            console.error('Failed to recover drawn stores', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการ recover';
            toast.error(errorMessage);
        } finally {
            setRecovering(false);
        }
    };

    const getStatsByZone = (zone?: BoothZone) => {
        if (!zone) {
            // Aggregate all stats
            return stats.reduce((acc, curr) => ({
                zone: 'ALL' as any,
                total: (acc.total || 0) + curr.total,
                assigned: (acc.assigned || 0) + curr.assigned,
                available: (acc.available || 0) + curr.available,
                pending: (acc.pending || 0) + curr.pending,
                confirmed: (acc.confirmed || 0) + curr.confirmed,
                forfeited: (acc.forfeited || 0) + curr.forfeited,
                undefined: (acc.undefined || 0) + curr.undefined,
            }), {} as BoothStatsResponse);
        }
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
        <div className="overflow-auto container mx-auto p-6 space-y-6">
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
                        onClick={handleRecoverDrawnStores}
                        disabled={recovering}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Recover และ assign booth ให้ร้านที่ถูกสุ่มไปแล้วแต่ยังไม่มี booth"
                    >
                        {recovering ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Wrench className="w-5 h-5" />
                        )}
                        {recovering ? 'กำลัง Recover...' : 'Recover Drawn Stores'}
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

            {/* Barcode Scanner - Lookup Store */}
            <div className="bg-white border-2 border-blue-300 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Scan className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">ค้นหาร้านจากบาร์โค้ดนิสิต</h2>
                </div>
                <div className="flex gap-3">
                    <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="สแกนบาร์โค้ดที่นี่... (เช่น 20065105035316)"
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                        autoComplete="off"
                    />
                    <button
                        onClick={handleScan}
                        disabled={scanning || !barcode.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {scanning ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                        ค้นหา
                    </button>
                </div>
                {/* <p className="text-sm text-gray-600 mt-3">
                    💡 สแกนบาร์โค้ดจากบัตรนิสิตเพื่อตรวจสอบว่าอยู่ร้านไหน พร้อมดูข้อมูล booth assignment
                </p> */}
            </div>

            {/* Lookup Result Display */}
            {lookupResult && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            ผลการค้นหา
                        </h3>
                        <div className="flex items-center gap-2">
                            {/* Show action buttons only if there's a pending assignment */}
                            {lookupResult.assignment && lookupResult.assignment.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await verifyByStoreId({
                                                    storeId: lookupResult.store.id,
                                                    barcode: lookupResult.scannedBarcode
                                                });
                                                toast.success(`ยืนยัน booth สำเร็จ! ร้าน "${lookupResult.store.storeName}"`);
                                                setLookupResult(null);
                                                fetchData();
                                            } catch (error: any) {
                                                console.error('Failed to verify', error);
                                                const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยัน';
                                                toast.error(errorMessage);
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        ยืนยัน
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (lookupResult.assignment) {
                                                handleForfeit(lookupResult.assignment.id, lookupResult.store.storeName);
                                                setLookupResult(null);
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        ปฏิเสธ
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setLookupResult(null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                                <XCircle className="w-4 h-4" />
                                ยกเลิก
                            </button>
                        </div>
                    </div>

                    {/* Assignment Info */}
                    {lookupResult.assignment ? (
                        <div className="bg-white rounded-xl p-4 mb-4">
                            <h4 className="font-semibold text-gray-700 mb-2">ข้อมูล Booth Assignment</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Booth Number</p>
                                    <p className="text-2xl font-bold text-orange-600">{lookupResult.assignment.booth.boothNumber}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Zone</p>
                                    <p className="font-semibold">{lookupResult.assignment.booth.zone}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">สถานะ</p>
                                    <p>{getStatusBadge(lookupResult.assignment.status)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Draw Order</p>
                                    <p className="font-mono">#{lookupResult.assignment.drawOrder}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <p className="text-yellow-800 text-sm">⚠️ ร้านนี้ยังไม่มี booth assignment</p>
                                <button
                                    onClick={() => {
                                        // Set the store ID and open the manual assign modal
                                        setManualStoreId(lookupResult.store.id.toString());
                                        setShowManualAssignModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                    <QrCode className="w-4 h-4" />
                                    Assign Booth
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Nisit Info */}
                    <div className="bg-white rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">ข้อมูลนิสิต</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500">รหัสนิสิต</p>
                                <p className="font-mono font-semibold">{lookupResult.nisit.nisitId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">ชื่อ-นามสกุล</p>
                                <p className="font-semibold">{lookupResult.nisit.firstName} {lookupResult.nisit.lastName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">บทบาท</p>
                                <p className="font-semibold">
                                    {lookupResult.nisit.role === 'admin' ? (
                                        <span className="text-purple-600">👑 Admin</span>
                                    ) : (
                                        <span className="text-blue-600">👤 Member</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">อีเมล</p>
                                <p className="text-sm">{lookupResult.nisit.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Store Info */}
                    <div className="bg-white rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">ข้อมูลร้าน</h4>
                        <div className="space-y-2">
                            <div>
                                <p className="text-gray-500 text-sm">ชื่อร้าน</p>
                                <p className="text-xl font-bold text-gray-800">{lookupResult.store.storeName}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Store ID</p>
                                    <p className="font-mono font-semibold">{lookupResult.store.id}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">ประเภท</p>
                                    <p className="font-semibold">{lookupResult.store.goodType || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">สถานะ</p>
                                    <p className="font-semibold">{lookupResult.store.state}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Store Members */}
                    <div className="bg-white rounded-xl p-4 mb-4">
                        <h4 className="font-semibold text-gray-700 mb-3">สมาชิกร้าน</h4>

                        {/* Members */}
                        {lookupResult.store.members.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 font-medium">สมาชิก ({lookupResult.store.members.length} คน)</p>
                                {lookupResult.store.members.map((member, index) => (
                                    <div key={member.nisitId} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs">ชื่อ-นามสกุล</p>
                                                <p className="font-semibold">{member.firstName} {member.lastName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">รหัสนิสิต</p>
                                                <p className="font-mono text-xs">{member.nisitId}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">อีเมล</p>
                                                <p className="text-xs">{member.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">เบอร์โทรศัพท์</p>
                                                <p className="text-xs">{member.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">บทบาท</p>
                                                <p className="text-xs">{
                                                    member.nisitId === lookupResult.store.storeAdmin?.nisitId ? 'Admin' : 'Member'
                                                }</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">ไม่มีสมาชิก</p>
                        )}
                    </div>
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
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ยืนยันโดย</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">เวลา</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">กำลังโหลด...</p>
                                    </td>
                                </tr>
                            ) : filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
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
                                        <td className="px-4 py-3">
                                            {assignment.store?.goodType && (
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${assignment.store.goodType === 'Food'
                                                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                    }`}>
                                                    {assignment.store.goodType}
                                                </span>
                                            )}
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
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            const storeAdminNisitId = assignment.store?.storeAdminNisitId;
                                                            if (!storeAdminNisitId) {
                                                                toast.error('ไม่พบข้อมูล admin ของร้านนี้');
                                                                return;
                                                            }
                                                            // สร้าง barcode ตาม pattern 200{nisitId}8
                                                            const barcode = `200${storeAdminNisitId}8`;
                                                            try {
                                                                await verifyAssignment({ assignmentId: assignment.id, barcode });
                                                                toast.success(`ยืนยัน booth สำเร็จ! ร้าน "${assignment.store?.storeName}"`);
                                                                fetchData();
                                                            } catch (error: any) {
                                                                console.error('Failed to verify', error);
                                                                const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยัน';
                                                                toast.error(errorMessage);
                                                            }
                                                        }}
                                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                    >
                                                        ยืนยัน
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <button
                                                        onClick={() => handleForfeit(assignment.id, assignment.store?.storeName || '')}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        สละสิทธิ์
                                                    </button>
                                                </div>
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
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Assign Booth</h2>
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

                            {/* Mode Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">โหมดการ Assign</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAssignMode('auto')}
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${assignMode === 'auto'
                                            ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        🤖 Auto
                                    </button>
                                    <button
                                        onClick={() => setAssignMode('manual')}
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${assignMode === 'manual'
                                            ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        ✍️ Manual
                                    </button>
                                </div>
                            </div>

                            {/* Booth Number Input (only show in manual mode) */}
                            {assignMode === 'manual' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเลข Booth</label>
                                    <input
                                        type="text"
                                        value={manualBoothNumber}
                                        onChange={(e) => setManualBoothNumber(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono uppercase"
                                        placeholder="เช่น M1, M55"
                                    />
                                </div>
                            )}

                            {/* Info Box */}
                            <div className={`p-3 rounded-lg ${assignMode === 'auto' ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                                <p className={`text-sm ${assignMode === 'auto' ? 'text-blue-700' : 'text-yellow-700'}`}>
                                    {assignMode === 'auto'
                                        ? '🤖 ระบบจะเลือก booth ถัดไปตาม zone ของร้าน (ขึ้นอยู่กับ goodType)'
                                        : '✍️ คุณสามารถระบุหมายเลข booth ที่ต้องการได้เอง'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowManualAssignModal(false);
                                    setManualStoreId('');
                                    setManualBoothNumber('');
                                    setAssignMode('auto');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleManualAssign}
                                disabled={assigning || !manualStoreId || (assignMode === 'manual' && !manualBoothNumber)}
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
