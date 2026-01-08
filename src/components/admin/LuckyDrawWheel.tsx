'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { generateWheel, getActiveEntries, checkBoothAvailability } from '@/services/admin/luckyDrawService';
import { toast } from 'sonner';
import { RefreshCw, Maximize, Minimize, RotateCcw } from 'lucide-react';

const Wheel = dynamic(() => import('react-custom-roulette').then((mod) => mod.Wheel), {
    ssr: false,
});

const COLORS = [
    '#DC143C', // แดงเข้ม (Crimson Red)
    '#4169E1', // น้ำเงินเข้ม (Royal Blue)
    '#FFD700', // เหลืองทอง (Gold)
    '#228B22', // เขียวป่า (Forest Green)
];

interface LuckyDrawWheelProps {
    onWinnerSelected: (winnerName: string) => Promise<any>;
}

export default function LuckyDrawWheel({ onWinnerSelected }: LuckyDrawWheelProps) {
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const [allEntries, setAllEntries] = useState<string[]>([]);
    const [wheelData, setWheelData] = useState<any[]>([{ option: 'Loading...', style: { backgroundColor: '#ccc' } }]);
    const [winnerName, setWinnerName] = useState<string>("");
    const [loadingStores, setLoadingStores] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showWinnerPopup, setShowWinnerPopup] = useState(false);
    const [hasAvailableBooths, setHasAvailableBooths] = useState(true);

    // 🎵 Audio refs for sound effects
    const audioContextRef = useRef<AudioContext | null>(null);
    const wheelContainerRef = useRef<HTMLDivElement>(null);
    const spinSoundRef = useRef<HTMLAudioElement | null>(null);
    const winSoundRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio context
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }, []);

    // 🖥️ Fullscreen handlers
    const toggleFullscreen = async () => {
        if (!wheelContainerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await wheelContainerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
            toast.error('ไม่สามารถเข้าโหมดเต็มจอได้');
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // 🎵 Play ticking sound while spinning
    useEffect(() => {
        if (!mustSpin) return;

        const tickInterval = setInterval(() => {
            playSpinSound();
        }, 100); // Play tick sound every 100ms

        return () => clearInterval(tickInterval);
    }, [mustSpin]);

    // 🎵 Play spinning sound (ticking sound)
    const playSpinSound = () => {
        // if (!audioContextRef.current) return;

        // const context = audioContextRef.current;
        // const oscillator = context.createOscillator();
        // const gainNode = context.createGain();

        // oscillator.connect(gainNode);
        // gainNode.connect(context.destination);

        // oscillator.frequency.value = 400;
        // oscillator.type = 'square';

        // gainNode.gain.setValueAtTime(0.1, context.currentTime);
        // gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

        // oscillator.start(context.currentTime);
        // oscillator.stop(context.currentTime + 0.1);
    };

    // 🎵 Play winner announcement sound
    const playWinSound = () => {
        if (!audioContextRef.current) return;

        const context = audioContextRef.current;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (celebration chord)

        notes.forEach((freq, index) => {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            const startTime = context.currentTime + (index * 0.1);
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    };

    // 🔥 คำนวณขนาดฟอนต์ตามจำนวนช่อง
    const calculateFontSize = (entryCount: number): number => {
        if (entryCount <= 50) return 16;      // ช่องน้อย ฟอนต์ใหญ่
        if (entryCount <= 100) return 4;     // ช่องปานกลาง
        if (entryCount <= 200) return 3;     // ช่องค่อนข้างเยอะ
        if (entryCount <= 300) return 2;     // ช่องเยอะ
        if (entryCount <= 500) return 1;      // ช่องเยอะมาก
        return 1;                              // ช่องเยอะสุด ๆ
    };

    // 🔥 คำนวณความยาวข้อความสูงสุดตามจำนวนช่อง (ป้องกันล้นขอบ)
    const calculateMaxTextLength = (entryCount: number): number => {
        if (entryCount <= 50) return 25;      // ช่องน้อย ข้อความยาวได้
        if (entryCount <= 100) return 8;      // ช่องปานกลาง
        if (entryCount <= 200) return 6;      // ช่องค่อนข้างเยอะ
        if (entryCount <= 300) return 5;      // ช่องเยอะ
        if (entryCount <= 500) return 4;      // ช่องเยอะมาก
        return 3;                              // ช่องเยอะสุด ๆ
    };

    /**
     * ตรวจสอบว่ามี booth ว่างหรือไม่
     */
    const checkAvailability = async () => {
        try {
            const availability = await checkBoothAvailability();
            setHasAvailableBooths(availability.hasAvailableBooths);
            return availability;
        } catch (error) {
            console.error('Failed to check booth availability', error);
            return null;
        }
    };

    /**
     * โหลดรายชื่อร้านค้าครั้งแรก (generate wheel + create entries)
     */
    const loadWheelData = async () => {
        try {
            setLoadingStores(true);
            const response = await generateWheel({ state: 'Validated' });

            if (response.entries && response.entries.length > 0) {
                setAllEntries(response.entries);

                const maxLength = calculateMaxTextLength(response.entries.length);
                const wheelEntries = response.entries.map((entry, i) => ({
                    option: entry.length > maxLength ? entry.substring(0, maxLength) + '...' : entry,
                    style: {
                        backgroundColor: COLORS[i % COLORS.length],
                        textColor: 'white'
                    }
                }));
                setWheelData(wheelEntries);

                toast.success(`โหลดข้อมูล ${response.totalStores} ร้านค้าทั้งหมดลงวงล้อเรียบร้อยแล้ว`);

                // ตรวจสอบ booth availability
                await checkAvailability();
            }
        } catch (error: any) {
            console.error('Failed to load wheel data', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
            toast.error(errorMessage);
        } finally {
            setLoadingStores(false);
        }
    };

    /**
     * Refresh รายชื่อร้านค้า (ดึงเฉพาะที่ยังไม่ถูกสุ่ม)
     */
    const refreshActiveEntries = async () => {
        try {
            setLoadingStores(true);
            const entries = await getActiveEntries();

            if (entries && entries.length > 0) {
                setAllEntries(entries);

                const maxLength = calculateMaxTextLength(entries.length);
                const wheelEntries = entries.map((entry, i) => ({
                    option: entry.length > maxLength ? entry.substring(0, maxLength) + '...' : entry,
                    style: {
                        backgroundColor: COLORS[i % COLORS.length],
                        textColor: 'white'
                    }
                }));
                setWheelData(wheelEntries);

                toast.success(`รีเฟรชรายชื่อเรียบร้อย: เหลือ ${entries.length} ร้าน`);

                // ตรวจสอบ booth availability
                await checkAvailability();
            } else {
                setAllEntries([]);
                setWheelData([{ option: 'ไม่มีร้านค้าที่ยังไม่ถูกสุ่ม', style: { backgroundColor: '#ccc', textColor: '#666' } }]);
                toast.info('ไม่มีร้านค้าที่ยังไม่ถูกสุ่ม');
            }
        } catch (error: any) {
            console.error('Failed to refresh entries', error);
            toast.error('ไม่สามารถรีเฟรชรายชื่อได้');
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

        const maxLength = calculateMaxTextLength(mockStores.length);
        const wheelEntries = mockStores.map((entry, i) => ({
            option: entry.length > maxLength ? entry.substring(0, maxLength) + '...' : entry,
            style: {
                backgroundColor: COLORS[i % COLORS.length],
                textColor: 'white'
            }
        }));
        setWheelData(wheelEntries);

        toast.success(`โหลด Mock Data ${mockStores.length} ร้านเรียบร้อยแล้ว (ทดสอบ)`);
    };

    const handleSpinClick = async () => {
        if (mustSpin || allEntries.length === 0) {
            if (allEntries.length === 0) toast.error('กรุณาโหลดรายชื่อร้านค้าก่อน');
            return;
        }

        // ตรวจสอบว่ามี booth ว่างหรือไม่
        const availability = await checkAvailability();
        if (availability && !availability.hasAvailableBooths) {
            toast.error('⚠️ ไม่มี booth ว่างเหลือแล้ว!\nไม่สามารถจับฉลากได้ กรุณาเพิ่ม booth หรือจัดการ booth ที่มีอยู่');
            return;
        }

        // 🎵 Play initial spin sound
        playSpinSound();

        // สุ่มผู้ชนะจากรายชื่อทั้งหมด
        const randomIndex = Math.floor(Math.random() * allEntries.length);
        const winner = allEntries[randomIndex];
        setWinnerName(winner);

        // ตั้งให้วงล้อหยุดที่ช่องนั้นเลย
        setPrizeNumber(randomIndex);
        setMustSpin(true);
    };

    const handleStopSpinning = async () => {
        setMustSpin(false);

        // 🎵 Play winner sound
        playWinSound();

        // 🎉 Show winner popup
        setShowWinnerPopup(true);

        toast.success(`🎉 ผู้ชนะคือ: ${winnerName}`);

        // ⏳ บันทึก winner (backend จะเก็บไว้แม้ assign ไม่สำเร็จ)
        try {
            const result: any = await onWinnerSelected(winnerName);

            // ตรวจสอบว่า assign booth สำเร็จหรือไม่
            if (result?.assignmentError) {
                toast.warning(`⚠️ ${result.message}\nร้านถูกบันทึกแล้ว แต่ยังไม่ได้ booth`);
            }
        } catch (error: any) {
            console.error('Failed to save winner:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'เกิดข้อผิดพลาด';
            toast.error(`❌ ${errorMessage}`);
        }

        // ✅ ลบผู้ชนะออกจากรายชื่อเสมอ (เพราะ backend เก็บ winner ไว้แล้ว)
        const updatedEntries = allEntries.filter(entry => entry !== winnerName);
        setAllEntries(updatedEntries);

        // อัปเดตข้อมูลวงล้อ
        if (updatedEntries.length > 0) {
            const maxLength = calculateMaxTextLength(updatedEntries.length);
            const updatedWheelData = updatedEntries.map((entry, i) => ({
                option: entry.length > maxLength ? entry.substring(0, maxLength) + '...' : entry,
                style: {
                    backgroundColor: COLORS[i % COLORS.length],
                    textColor: 'white'
                }
            }));
            setWheelData(updatedWheelData);
            toast.info(`เหลือร้านค้าอีก ${updatedEntries.length} ร้าน`);
        } else {
            // ถ้าไม่เหลือร้านแล้ว
            setWheelData([{ option: 'หมดรายชื่อแล้ว', style: { backgroundColor: '#ccc', textColor: '#666' } }]);
            toast.warning('หมุนครบทุกร้านแล้ว! กรุณาโหลดรายชื่อใหม่');
        }
    };

    return (
        <div
            ref={wheelContainerRef}
            className={`bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col ${isFullscreen
                ? 'h-screen w-screen fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-purple-50'
                : 'h-[700px]'
                }`}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-2xl">🎡</span> Lucky Draw Wheel
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-green-600 hover:text-green-700 flex items-center gap-2"
                        title={isFullscreen ? 'ออกจากโหมดเต็มจอ' : 'ขยายเต็มจอ'}
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        <span className="text-sm font-medium">{isFullscreen ? 'ย่อ' : 'ขยาย'}</span>
                    </button>
                    <button
                        onClick={refreshActiveEntries}
                        disabled={loadingStores}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700 flex items-center gap-2 disabled:opacity-50"
                        title="รีเฟรชรายชื่อร้านที่ยังไม่ถูกสุ่ม"
                    >
                        <RefreshCw className={`w-5 h-5 ${loadingStores ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">รีเฟรช</span>
                    </button>
                    <button
                        onClick={loadWheelData}
                        disabled={loadingStores}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-orange-600 hover:text-orange-700 flex items-center gap-2 disabled:opacity-50"
                        title="โหลดรายชื่อร้านใหม่ทั้งหมด (reset)"
                    >
                        <RotateCcw className={`w-5 h-5 ${loadingStores ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-medium">โหลดใหม่</span>
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
                {!isFullscreen && (
                    <div className="text-center space-y-2">
                        <p className="text-lg font-semibold text-gray-700">
                            จำนวนร้านค้าทั้งหมด: <span className="text-blue-600">{allEntries.length}</span> ร้าน
                        </p>
                        {allEntries.length > 0 && (
                            <p className="text-sm text-gray-500">
                                แสดงชื่อร้านค้าทั้งหมดบนวงล้อ • คลิกที่วงล้อเพื่อเริ่มหมุน
                            </p>
                        )}
                    </div>
                )}

                {/* 🔥 ส่วนปรับแต่งวงล้อ - คลิกเพื่อหมุน */}
                <div
                    className={`relative ${isFullscreen
                        ? 'scale-[1.2] sm:scale-[1.4] md:scale-[1.5] lg:scale-[1.6]'
                        : 'scale-100 lg:scale-110'
                        } ${mustSpin
                            ? 'cursor-not-allowed'
                            : allEntries.length === 0
                                ? 'cursor-not-allowed opacity-50'
                                : isFullscreen
                                    ? 'cursor-pointer'
                                    : 'cursor-pointer hover:scale-105 transition-transform duration-200'
                        }`}
                    onClick={handleSpinClick}
                    title={mustSpin ? 'กำลังหมุน...' : allEntries.length === 0 ? 'กรุณาโหลดรายชื่อร้านค้าก่อน' : 'คลิกเพื่อหมุนวงล้อ'}
                >

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
                        textDistance={75} // ขยับตัวหนังสือออกไปทางขอบวงล้อ
                    />
                </div>
            </div>

            {/* 🎉 Winner Popup Modal with Confetti */}
            {showWinnerPopup && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowWinnerPopup(false)}
                >
                    {/* Confetti Effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute animate-confetti"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: '-10%',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: ['#DC143C', '#4169E1', '#FFD700', '#228B22'][i % 4],
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Winner Card */}
                    <div
                        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-bounce-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 -mx-8 -mt-8 px-8 py-6 rounded-t-3xl mb-6">
                            <h2 className="text-2xl font-bold text-white text-center">
                                🎉 เรามีผู้ชนะ! 🎉
                            </h2>
                        </div>

                        {/* Winner Name */}
                        <div className="text-center mb-8">
                            <p className="text-5xl font-extrabold text-gray-800 break-words leading-tight">
                                {winnerName}
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowWinnerPopup(false)}
                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
                        >
                            ปิด
                        </button>
                    </div>
                </div>
            )}

            {/* Confetti Animation Styles */}
            <style jsx>{`
                @keyframes confetti {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes bounce-in {
                    0% {
                        transform: scale(0.3);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                .animate-confetti {
                    animation: confetti linear infinite;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                
                .animate-bounce-in {
                    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
            `}</style>
        </div>
    );
}
