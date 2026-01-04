'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    getAllBooths,
    getBoothStats,
    importBoothRange,
    deleteAllBooths,
    BoothResponse,
    BoothStatsResponse,
    BoothZone,
} from '@/services/admin/boothService';
import { Plus, Trash2, RefreshCw, MapPin, Utensils, Package, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { ZoneMMap } from '@/components/admin/booth/ZoneMMap';

export default function BoothManagementPage() {
    const [booths, setBooths] = useState<BoothResponse[]>([]);
    const [stats, setStats] = useState<BoothStatsResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | BoothZone>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importForm, setImportForm] = useState({
        prefix: 'M',
        start: 1,
        end: 20,
        zone: 'FOOD' as BoothZone,
    });
    const [importing, setImporting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [boothsData, statsData] = await Promise.all([
                getAllBooths(),
                getBoothStats(),
            ]);
            setBooths(boothsData);
            setStats(statsData);
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

    const handleImport = async () => {
        try {
            setImporting(true);
            const result = await importBoothRange({
                ranges: [{
                    prefix: importForm.prefix,
                    start: importForm.start,
                    end: importForm.end,
                    zone: importForm.zone,
                }],
            });
            toast.success(result.message);
            setShowImportModal(false);
            fetchData();
        } catch (error: any) {
            console.error('Failed to import booths', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการ import booth';
            toast.error(errorMessage);
        } finally {
            setImporting(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Import Booth (Range)</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                                <input
                                    type="text"
                                    value={importForm.prefix}
                                    onChange={(e) => setImportForm({ ...importForm, prefix: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="M"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                                    <input
                                        type="number"
                                        value={importForm.start}
                                        onChange={(e) => setImportForm({ ...importForm, start: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                                    <input
                                        type="number"
                                        value={importForm.end}
                                        onChange={(e) => setImportForm({ ...importForm, end: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        min={1}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                                <select
                                    value={importForm.zone}
                                    onChange={(e) => setImportForm({ ...importForm, zone: e.target.value as BoothZone })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="FOOD">🍜 FOOD (อาหาร)</option>
                                    <option value="NON_FOOD">📦 NON_FOOD (ไม่ใช่อาหาร)</option>
                                </select>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Preview:</strong> {importForm.prefix}{importForm.start} - {importForm.prefix}{importForm.end}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    จำนวน: {Math.max(0, importForm.end - importForm.start + 1)} booth
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importing ? 'กำลัง Import...' : 'Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
