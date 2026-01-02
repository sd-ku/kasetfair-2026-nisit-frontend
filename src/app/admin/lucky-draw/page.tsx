'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Wheel = dynamic(() => import('react-custom-roulette').then((mod) => mod.Wheel), {
    ssr: false,
});
import { generateWheel, createLuckyDrawWinner, getLuckyDrawWinners, LuckyDrawResponse } from '@/services/admin/luckyDrawService';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'];

export default function OptimizedWheel() {
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);

    // เก็บรายชื่อร้านค้าทั้งหมด
    const [allEntries, setAllEntries] = useState<string[]>([]);

    // ข้อมูลที่แสดงบนวงล้อ (จะเท่ากับ allEntries ทั้งหมด)
    const [wheelData, setWheelData] = useState<any[]>([{ option: 'Loading...', style: { backgroundColor: '#ccc' } }]);

    const [winnerName, setWinnerName] = useState<string>("");
    const [winners, setWinners] = useState<LuckyDrawResponse[]>([]);
    const [latestWinner, setLatestWinner] = useState<string | null>(null);
    const [loadingStores, setLoadingStores] = useState(false);

    const fetchWinners = async () => {
        try {
            const data = await getLuckyDrawWinners();
            setWinners(data);
        } catch (error) {
            console.error('Failed to fetch winners', error);
        }
    };

    const loadWheelData = async () => {
        try {
            setLoadingStores(true);
            const response = await generateWheel({ state: 'Validated' });

            if (response.entries && response.entries.length > 0) {
                // เก็บรายชื่อทั้งหมด
                setAllEntries(response.entries);

                // แสดงชื่อร้านค้าทั้งหมดบนวงล้อ (เหมือน wheelofnames)
                const wheelEntries = response.entries.map((entry, i) => ({
                    option: entry.length > 20 ? entry.substring(0, 20) + '..' : entry,
                    style: {
                        backgroundColor: COLORS[i % COLORS.length],
                        textColor: 'white'
                    }
                }));
                setWheelData(wheelEntries);

                toast.success(`โหลดข้อมูล ${response.totalStores} ร้านค้าทั้งหมดลงวงล้อเรียบร้อยแล้ว`);
            }
        } catch (error: any) {
            console.error('Failed to load wheel data', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
            toast.error(errorMessage);
        } finally {
            setLoadingStores(false);
        }
    };

    // 🧪 Mock Data สำหรับทดสอบ
    const loadMockData = () => {
        const mockStores = [
            'ร้านกาแฟสดใจกลางเมือง',
            'ร้านขนมหวานแสนอร่อย',
            'ร้านอาหารเจ้าเด็ด',
            'ร้านเสื้อผ้าแฟชั่น',
            'ร้านของใช้ในบ้าน',
            'ร้านหนังสือและเครื่องเขียน',
            'ร้านดอกไม้บานสวย',
            'ร้านขายพืชสวนถูกใจ',
            'ร้านขนมไทยโบราณ',
            'ร้านเบเกอรี่หอมกรุ่น',
            'ร้านน้ำผลไม้สดใหม่',
            'ร้านอุปกรณ์กีฬา',
            'ร้านของเล่นเด็ก',
            'ร้านเครื่องประดับ',
            'ร้านรองเท้าคุณภาพ'
        ];

        setAllEntries(mockStores);

        const wheelEntries = mockStores.map((entry, i) => ({
            option: entry.length > 20 ? entry.substring(0, 20) + '..' : entry,
            style: {
                backgroundColor: COLORS[i % COLORS.length],
                textColor: 'white'
            }
        }));
        setWheelData(wheelEntries);

        toast.success(`โหลด Mock Data ${mockStores.length} ร้านเรียบร้อยแล้ว (ทดสอบ)`);
    };

    useEffect(() => {
        fetchWinners();
        loadWheelData();
    }, []);

    const handleSpinClick = () => {
        if (mustSpin || allEntries.length === 0) {
            if (allEntries.length === 0) toast.error('กรุณาโหลดรายชื่อร้านค้าก่อน');
            return;
        }

        // สุ่มผู้ชนะจากรายชื่อทั้งหมด
        const randomIndex = Math.floor(Math.random() * allEntries.length);
        const winnerName = allEntries[randomIndex];
        setWinnerName(winnerName);

        // ตั้งให้วงล้อหยุดที่ช่องนั้นเลย
        setPrizeNumber(randomIndex);
        setMustSpin(true);
    };

    const handleStopSpinning = async () => {
        setMustSpin(false);
        setLatestWinner(winnerName);
        toast.success(`🎉 ผู้ชนะคือ: ${winnerName}`);

        try {
            await createLuckyDrawWinner(winnerName);
            fetchWinners();
        } catch (error) {
            console.error('Failed to save winner', error);
            toast.error('ไม่สามารถบันทึกผู้ชนะได้');
        }
    };

    // 🔥 คำนวณขนาดฟอนต์ตามจำนวนช่อง
    const calculateFontSize = (entryCount: number): number => {
        if (entryCount <= 50) return 16;      // ช่องน้อย ฟอนต์ใหญ่
        if (entryCount <= 100) return 14;     // ช่องปานกลาง
        if (entryCount <= 200) return 12;     // ช่องค่อนข้างเยอะ
        if (entryCount <= 300) return 10;     // ช่องเยอะ
        if (entryCount <= 500) return 8;      // ช่องเยอะมาก
        return 7;                              // ช่องเยอะสุด ๆ
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 animate-fade-in-down">Lucky Draw System</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Wheel Section */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[700px]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-2xl">🎡</span> Lucky Draw Wheel
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadWheelData}
                                disabled={loadingStores}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${loadingStores ? 'animate-spin' : ''}`} />
                                <span className="text-sm font-medium">โหลดรายชื่อร้าน</span>
                            </button>
                            <button
                                onClick={loadMockData}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-purple-600 hover:text-purple-700 flex items-center gap-2"
                            >
                                🧪
                                <span className="text-sm font-medium">Mock Data (15 ร้าน)</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-semibold text-gray-700">
                                จำนวนร้านค้าทั้งหมด: <span className="text-blue-600">{allEntries.length}</span> ร้าน
                            </p>
                            {allEntries.length > 0 && (
                                <p className="text-sm text-gray-500">
                                    แสดงชื่อร้านค้าทั้งหมดบนวงล้อ • กดปุ่ม "สุ่มรางวัล" เพื่อเริ่มหมุน
                                </p>
                            )}
                        </div>

                        {/* 🔥 ส่วนปรับแต่งวงล้อ */}
                        <div className="scale-100 lg:scale-100">
                            <Wheel
                                mustStartSpinning={mustSpin}
                                prizeNumber={prizeNumber}
                                data={wheelData}
                                onStopSpinning={handleStopSpinning}

                                // Config ให้สวยเหมือน wheelofnames
                                spinDuration={0.8} // ความเร็ว
                                outerBorderColor="#333"
                                innerRadius={10} // รูตรงกลาง
                                innerBorderColor="#333"
                                innerBorderWidth={0}
                                outerBorderWidth={0}
                                radiusLineWidth={0} // ไม่มีเส้นขอบระหว่างช่อง

                                // ✨ จุดสำคัญ: การจัดตัวอักษร
                                fontSize={calculateFontSize(allEntries.length)} // 🔥 ปรับขนาดอัตโนมัติตามจำนวนช่อง
                                perpendicularText={false} // 🔥 ให้ตัวหนังสือเป็นแนวนอนไปตามรัศมี
                                textDistance={62} // ขยับตัวหนังสือออกไปทางขอบวงล้อ
                            />
                        </div>

                        <button
                            onClick={handleSpinClick}
                            disabled={mustSpin || allEntries.length === 0}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 text-lg"
                        >
                            {mustSpin ? '🎲 กำลังหมุน...' : '🎲 กดสุ่มรางวัล'}
                        </button>
                    </div>
                </div>

                {/* Winners Section (เหมือนเดิม) */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[700px]">
                    {/* ... code ส่วนตาราง winners เหมือนเดิม ... */}
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
                            {/* ... table headers ... */}
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
            `}</style>
        </div>
    );
}