'use client';

import React, { useState, useEffect } from 'react';
import { createLuckyDrawWinner, getLuckyDrawWinners, getLuckyDrawEntries, LuckyDrawResponse, LuckyDrawEntryResponse } from '@/services/admin/luckyDrawService';
import { toast } from 'sonner';
import { RefreshCw, Users, X } from 'lucide-react';
import LuckyDrawWheel from '@/components/admin/LuckyDrawWheel';

export default function LuckyDrawPage() {
    const [winners, setWinners] = useState<LuckyDrawResponse[]>([]);
    const [latestWinner, setLatestWinner] = useState<string | null>(null);
    const [entries, setEntries] = useState<LuckyDrawEntryResponse[]>([]);
    const [showEntriesModal, setShowEntriesModal] = useState(false);

    const fetchWinners = async () => {
        try {
            const data = await getLuckyDrawWinners();
            setWinners(data);
        } catch (error) {
            console.error('Failed to fetch winners', error);
        }
    };

    const fetchEntries = async () => {
        try {
            const data = await getLuckyDrawEntries();
            setEntries(data);
        } catch (error) {
            console.error('Failed to fetch entries', error);
            toast.error('ไม่สามารถดึงข้อมูลผู้มีสิทธิ์จับฉลากได้');
        }
    };

    useEffect(() => {
        fetchWinners();
    }, []);

    const handleWinnerSelected = async (winnerName: string) => {
        setLatestWinner(winnerName);

        try {
            const result = await createLuckyDrawWinner(winnerName);
            fetchWinners();
            return result; // Return response เพื่อให้ wheel component ตรวจสอบ assignmentError
        } catch (error) {
            console.error('Failed to save winner', error);
            toast.error('ไม่สามารถบันทึกผู้ชนะได้');
            throw error; // Throw error เพื่อให้ wheel component จัดการ
        }
    };

    const handleOpenEntriesModal = async () => {
        await fetchEntries();
        setShowEntriesModal(true);
    };

    return (
        <div className="container overflow-auto mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 animate-fade-in-down">Lucky Draw System</h1>
                <button
                    onClick={handleOpenEntriesModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
                >
                    <Users className="w-5 h-5" />
                    <span>ดูรายชื่อผู้มีสิทธิ์</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Wheel Section */}
                <LuckyDrawWheel onWinnerSelected={handleWinnerSelected} />

                {/* Winners Section */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[700px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-2xl">🏆</span> Winners History
                        </h2>
                        <button onClick={fetchWinners} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    {latestWinner && (
                        <div className="mb-6 p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl text-center shadow-sm animate-bounce">
                            <p className="text-sm text-orange-600 uppercase tracking-wide font-bold mb-1">🎉 Recent Winner 🎉</p>
                            <p className="text-4xl lg:text-5xl font-extrabold text-gray-800 break-words">{latestWinner}</p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">No.</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Name</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-400 text-right uppercase tracking-wider border-b border-gray-100">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {winners.map((w, index) => (
                                    <tr key={w.id} className="group hover:bg-gray-50">
                                        <td className="px-4 py-4 text-gray-400 text-sm font-mono">#{winners.length - index}</td>
                                        <td className="px-4 py-4 font-semibold text-gray-700 text-lg">{w.winner}</td>
                                        <td className="px-4 py-4 text-right text-gray-500 text-sm">
                                            {new Date(w.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Entries Modal */}
            {showEntriesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-600" />
                                รายชื่อผู้มีสิทธิ์จับฉลาก
                            </h2>
                            <button
                                onClick={() => setShowEntriesModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-4 flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                    ทั้งหมด <span className="font-bold text-blue-600">{entries.length}</span> ร้านค้า
                                    {' | '}
                                    ยังไม่ถูกสุ่ม <span className="font-bold text-green-600">{entries.filter(e => !e.isDrawn).length}</span> ร้าน
                                    {' | '}
                                    ถูกสุ่มแล้ว <span className="font-bold text-orange-600">{entries.filter(e => e.isDrawn).length}</span> ร้าน
                                </p>
                                <button
                                    onClick={fetchEntries}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">ID</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">ชื่อร้านค้า</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 text-center">สถานะ</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 text-right">เวลาที่ถูกสุ่ม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {entries.map((entry) => (
                                            <tr
                                                key={entry.id}
                                                className={`hover:bg-gray-50 transition-colors ${entry.isDrawn ? 'bg-orange-50/30' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-sm font-mono text-gray-600">{entry.storeId}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-800">{entry.storeName}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {entry.isDrawn ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                            ถูกสุ่มแล้ว
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            ยังไม่ถูกสุ่ม
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                                                    {entry.drawnAt
                                                        ? new Date(entry.drawnAt).toLocaleString('th-TH', {
                                                            dateStyle: 'short',
                                                            timeStyle: 'short'
                                                        })
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowEntriesModal(false)}
                                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-md transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
            `}</style>
        </div>
    );
}
