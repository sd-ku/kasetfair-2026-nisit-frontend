'use client';

import React, { useEffect, useState } from 'react';
import { getLuckyDrawWinners, LuckyDrawResponse } from '@/services/admin/luckyDrawService';
import { WinnersDisplay } from '@/components/WinnersDisplay';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function WinnersPage() {
    const [winners, setWinners] = useState<LuckyDrawResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWinners = async () => {
        try {
            setLoading(true);
            const data = await getLuckyDrawWinners();
            setWinners(data);
        } catch (error) {
            console.error('Failed to fetch winners', error);
            toast.error('ไม่สามารถโหลดข้อมูลผู้ชนะได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWinners();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/home"
                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        กลับหน้าหลัก
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        🏆 รายชื่อผู้โชคดี
                    </h1>
                    <p className="text-gray-600">
                        รายชื่อผู้ที่ได้รับสิทธิ์จากการจับฉลาก Lucky Draw
                    </p>
                </div>

                {/* Winners Display */}
                <WinnersDisplay
                    winners={winners.map(w => ({
                        ...w,
                        boothNumber: w.boothNumber ?? undefined,
                        status: w.status ?? undefined
                    }))}
                    latestWinner={winners[0]?.winner}
                    onRefresh={fetchWinners}
                />
            </div>
        </div>
    );
}
