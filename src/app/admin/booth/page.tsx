'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    getAllBooths,
    getBoothStats,
    importBoothRange,
    deleteAllBooths,
    updateBoothOrder,
    getLastPriority,
    BoothResponse,
    BoothStatsResponse,
    BoothZone,
} from '@/services/admin/boothService';
import { Plus, Trash2, RefreshCw, MapPin, Utensils, Package, LayoutGrid, Settings, Save, RotateCcw as ResetIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { ZoneMMap } from '@/components/admin/booth/ZoneMMap';
import { ImportBoothModal, ImportFormData } from '@/components/admin/booth/ImportBoothModal';

export default function BoothManagementPage() {
    const [booths, setBooths] = useState<BoothResponse[]>([]);
    const [stats, setStats] = useState<BoothStatsResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | BoothZone | 'config'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [initialPriorityStart, setInitialPriorityStart] = useState(1);

    // Config mode state
    const [configZone, setConfigZone] = useState<BoothZone>('FOOD');
    const [foodBooths, setFoodBooths] = useState<BoothResponse[]>([]);
    const [nonFoodBooths, setNonFoodBooths] = useState<BoothResponse[]>([]);
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

            // แยก booth ตาม zone สำหรับ config mode
            const food = boothsData.filter(b => b.zone === 'FOOD').sort((a, b) => a.assignOrder - b.assignOrder);
            const nonFood = boothsData.filter(b => b.zone === 'NON_FOOD').sort((a, b) => a.assignOrder - b.assignOrder);
            setFoodBooths(food);
            setNonFoodBooths(nonFood);
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

    const handleBoothClick = (booth: BoothResponse) => {
        if (booth.isAssigned) {
            toast.info(`Booth ${booth.boothNumber} is assigned to ${booth.assignment?.store?.storeName} (${booth.assignment?.status})`);
        } else {
            toast.info(`Booth ${booth.boothNumber} is available. Click 'Import Booth' or use Lucky Draw to assign.`);
            // In a real scenario, this could open a manual assignment modal
        }
    };

    // Config mode functions
    const currentConfigBooths = configZone === 'FOOD' ? foodBooths : nonFoodBooths;
    const setCurrentConfigBooths = configZone === 'FOOD' ? setFoodBooths : setNonFoodBooths;

    const moveBoothUp = (index: number) => {
        if (index === 0) return;

        const newBooths = [...currentConfigBooths];
        [newBooths[index], newBooths[index - 1]] = [newBooths[index - 1], newBooths[index]];

        // Update assignOrder
        newBooths.forEach((booth, i) => {
            booth.assignOrder = i + 1;
        });

        setCurrentConfigBooths(newBooths);
    };

    const moveBoothDown = (index: number) => {
        if (index === currentConfigBooths.length - 1) return;

        const newBooths = [...currentConfigBooths];
        [newBooths[index], newBooths[index + 1]] = [newBooths[index + 1], newBooths[index]];

        // Update assignOrder
        newBooths.forEach((booth, i) => {
            booth.assignOrder = i + 1;
        });

        setCurrentConfigBooths(newBooths);
    };

    const handleSaveConfig = async () => {
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
            fetchData();
        } catch (error: any) {
            console.error('Failed to save booth order', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleResetConfig = () => {
        if (confirm('คุณต้องการรีเซ็ตการตั้งค่ากลับไปเป็นค่าเดิมหรือไม่?')) {
            fetchData();
            toast.info('รีเซ็ตการตั้งค่าแล้ว');
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
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Import Booth
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
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'config'
                            ? 'text-purple-600 border-b-2 border-purple-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Config
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
                ) : activeTab === 'config' ? (
                    /* Config Mode */
                    <div className="space-y-6">
                        {/* Config Header */}
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">จัดเรียงลำดับ Booth</h3>
                                <p className="text-sm text-gray-600 mt-1">กำหนดลำดับการ assign booth สำหรับแต่ละ zone</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleResetConfig}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ResetIcon className="w-5 h-5" />
                                    รีเซ็ท
                                </button>
                                <button
                                    onClick={handleSaveConfig}
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
                            <h4 className="font-semibold text-blue-800 mb-2">💡 วิธีการทำงาน</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• <strong>FOOD Zone</strong>: จะ assign booth จากลำดับที่ 1 → 2 → 3 ... (จากบนลงล่าง)</li>
                                <li>• <strong>NON-FOOD Zone</strong>: จะ assign booth จากลำดับที่สูงสุด → ต่ำลง (จากล่างขึ้นบน)</li>
                                <li>• ใช้ปุ่มลูกศรเพื่อเปลี่ยนลำดับ booth ตามที่ต้องการ</li>
                            </ul>
                        </div>

                        {/* Zone Tabs */}
                        <div className="flex gap-2 border-b border-gray-200">
                            <button
                                onClick={() => setConfigZone('FOOD')}
                                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${configZone === 'FOOD'
                                    ? 'text-orange-600 border-b-2 border-orange-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Utensils className="w-5 h-5" />
                                FOOD Zone ({foodBooths.length} booths)
                            </button>
                            <button
                                onClick={() => setConfigZone('NON_FOOD')}
                                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${configZone === 'NON_FOOD'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Package className="w-5 h-5" />
                                NON-FOOD Zone ({nonFoodBooths.length} booths)
                            </button>
                        </div>

                        {/* Booth List */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-200">
                                <h4 className="font-semibold text-gray-800">
                                    {configZone === 'FOOD' ? '🍔 FOOD Zone' : '📦 NON-FOOD Zone'} - ลำดับการ Assign
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {configZone === 'FOOD'
                                        ? 'Booth ที่อยู่บนสุดจะถูก assign ก่อน (ขยายจากบนลงล่าง)'
                                        : 'Booth ที่อยู่ล่างสุดจะถูก assign ก่อน (ขยายจากล่างขึ้นบน)'
                                    }
                                </p>
                            </div>

                            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                {currentConfigBooths.map((booth, index) => (
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
                                                disabled={index === currentConfigBooths.length - 1}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="เลื่อนลง"
                                            >
                                                <ArrowDown className="w-5 h-5 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'map' ? (
                    <ZoneMMap booths={booths} onBoothClick={handleBoothClick} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {filteredBooths.map((booth) => (
                            <div
                                key={booth.id}
                                onClick={() => handleBoothClick(booth)}
                                className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${booth.isAssigned
                                    ? booth.assignment?.status === 'CONFIRMED'
                                        ? 'bg-green-50 border-green-300'
                                        : booth.assignment?.status === 'PENDING'
                                            ? 'bg-yellow-50 border-yellow-300'
                                            : 'bg-red-50 border-red-300'
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                    }`}
                                title={booth.isAssigned
                                    ? `${booth.assignment?.store?.storeName || 'Unknown'} (${booth.assignment?.status})`
                                    : 'ว่าง'
                                }
                            >
                                <div className="flex justify-center mb-1">
                                    {getZoneIcon(booth.zone)}
                                </div>
                                <p className="font-bold text-gray-800">{booth.boothNumber}</p>
                                <p className="text-xs text-gray-500">#{booth.assignOrder}</p>
                                {booth.isAssigned && (
                                    <p className={`text-xs mt-1 font-medium ${booth.assignment?.status === 'CONFIRMED'
                                        ? 'text-green-600'
                                        : booth.assignment?.status === 'PENDING'
                                            ? 'text-yellow-600'
                                            : 'text-red-600'
                                        }`}>
                                        {booth.assignment?.status === 'CONFIRMED' ? '✓' : booth.assignment?.status === 'PENDING' ? '⏳' : '✗'}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
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
        </div>
    );
}
