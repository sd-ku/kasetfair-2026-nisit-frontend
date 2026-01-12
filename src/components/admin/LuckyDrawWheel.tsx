'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { generateWheel, getActiveEntries, checkBoothAvailability } from '@/services/admin/luckyDrawService';
import { toast } from 'sonner';
import { RefreshCw, Maximize, Minimize, RotateCcw, MoreVertical, Settings, Trophy } from 'lucide-react';
import { WinnersDisplay, WinnerEntry } from '@/components/WinnersDisplay';

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
    winners?: WinnerEntry[];
    onRefreshWinners?: () => void;
}

interface StoreEntry {
    storeId: number;
    storeName: string;
}

export default function LuckyDrawWheel({ onWinnerSelected, winners = [], onRefreshWinners }: LuckyDrawWheelProps) {
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const [allEntries, setAllEntries] = useState<StoreEntry[]>([]);
    const [wheelData, setWheelData] = useState<any[]>([{ option: 'Loading...', style: { backgroundColor: '#ccc' } }]);
    const [winnerName, setWinnerName] = useState<string>("");
    const [loadingStores, setLoadingStores] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showWinnerPopup, setShowWinnerPopup] = useState(false);
    const [hasAvailableBooths, setHasAvailableBooths] = useState(true);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [spinDuration, setSpinDuration] = useState(0.8); // ความเร็วการหมุน (วินาที)
    const [isMockMode, setIsMockMode] = useState(false); // ติดตามว่ากำลังใช้ mock data หรือไม่
    const [showWinnersInFullscreen, setShowWinnersInFullscreen] = useState(false); // แสดง Winners Display ในโหมดเต็มจอ
    const [selectedStoreType, setSelectedStoreType] = useState<'ALL' | 'Nisit' | 'Club'>('ALL'); // ประเภทร้านที่เลือก
    const [showRefreshMenu, setShowRefreshMenu] = useState(false); // แสดง dropdown menu สำหรับเลือกประเภทร้าน

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
    // คำนวณจากพื้นที่ของแต่ละช่องในวงล้อ
    const calculateFontSize = (entryCount: number): number => {
        if (entryCount === 0) return 20;

        // สมมติว่าวงล้อมีรัศมี 200px
        const wheelRadius = 200;

        // คำนวณความยาวส่วนโค้ง (arc length) ของแต่ละช่อง
        const arcLength = (2 * Math.PI * wheelRadius) / entryCount;

        // คำนวณขนาดฟอนต์ตามพื้นที่ว่าง
        // ยิ่ง arc length เล็ก (ช่องแคบ) ฟอนต์ก็ต้องเล็กลง
        let fontSize: number;

        if (arcLength >= 100) {
            // ช่องกว้างมาก (≤ 12 ช่อง) - ฟอนต์ใหญ่
            fontSize = 20;
        } else if (arcLength >= 50) {
            // ช่องกว้างปานกลาง (13-25 ช่อง) - ฟอนต์ปานกลาง
            fontSize = 16;
        } else if (arcLength >= 25) {
            // ช่องกว้างพอสมควร (26-50 ช่อง)
            fontSize = 12;
        } else if (arcLength >= 12) {
            // ช่องแคบ (51-100 ช่อง)
            fontSize = 8;
        } else if (arcLength >= 6) {
            // ช่องแคบมาก (101-200 ช่อง)
            fontSize = 6;
        } else if (arcLength >= 4) {
            // ช่องแคบมากๆ (201-300 ช่อง)
            fontSize = 4;
        } else {
            // ช่องแคบสุด (300+ ช่อง)
            fontSize = 3;
        }

        return fontSize;
    };

    // 🔥 คำนวณความยาวข้อความสูงสุดตามจำนวนช่อง (ป้องกันล้นขอบ)
    // คำนวณจากรัศมีของแต่ละช่องในวงล้อ
    const calculateMaxTextLength = (entryCount: number): number => {
        if (entryCount === 0) return 25;

        // สมมติว่าวงล้อมีรัศมี 200px (ค่าประมาณ)
        const wheelRadius = 200;

        // คำนวณความยาวส่วนโค้ง (arc length) ของแต่ละช่อง
        // Arc Length = (2 × π × radius) / numberOfSegments
        const arcLength = (2 * Math.PI * wheelRadius) / entryCount;

        // คำนวณขนาดฟอนต์สำหรับจำนวนช่องนี้
        const fontSize = calculateFontSize(entryCount);

        // ความกว้างของตัวอักษรขึ้นกับขนาดฟอนต์
        // โดยประมาณ: charWidth ≈ fontSize * 0.6 (สำหรับตัวอักษรไทย)
        const charWidth = fontSize * 0.7; // ใช้ 0.7 เพื่อความปลอดภัย

        // คำนวณจำนวนตัวอักษรสูงสุดที่พอดีกับส่วนโค้ง
        // ลด 20% เพื่อให้มี margin ป้องกันล้น
        const maxChars = Math.floor((arcLength * 0.8) / charWidth);

        // จำกัดค่าต่ำสุดและสูงสุด
        return Math.max(3, Math.min(30, maxChars));
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
                // แปลง string "123. ชื่อร้าน" เป็น object {storeId, storeName}
                const parsedEntries: StoreEntry[] = response.entries.map((entry: string) => {
                    const match = entry.match(/^(\d+)\.\s*(.+)$/);
                    if (match) {
                        return {
                            storeId: parseInt(match[1]),
                            storeName: match[2]
                        };
                    }
                    // Fallback ถ้า format ไม่ตรง
                    return { storeId: 0, storeName: entry };
                });
                setAllEntries(parsedEntries);

                const maxLength = calculateMaxTextLength(parsedEntries.length);
                const wheelEntries = parsedEntries.map((entry, i) => {
                    const displayText = `${entry.storeId}. ${entry.storeName}`;
                    return {
                        option: displayText.length > maxLength ? displayText.substring(0, maxLength) + '...' : displayText,
                        style: {
                            backgroundColor: COLORS[i % COLORS.length],
                            textColor: 'white'
                        }
                    };
                });
                setWheelData(wheelEntries);

                toast.success(`โหลดข้อมูล ${response.totalStores} ร้านค้าทั้งหมดลงวงล้อเรียบร้อยแล้ว`);

                // ตั้งค่าว่าไม่ใช่ mock mode
                setIsMockMode(false);

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
     * @param type - ประเภทร้าน: 'Nisit', 'Club', หรือ undefined (ALL)
     */
    const refreshActiveEntries = async (type?: 'Nisit' | 'Club') => {
        try {
            setLoadingStores(true);
            const entries = await getActiveEntries(type);

            if (entries && entries.length > 0) {
                // แปลง string "123. ชื่อร้าน" เป็น object {storeId, storeName}
                const parsedEntries: StoreEntry[] = entries.map((entry: string) => {
                    const match = entry.match(/^(\d+)\.\s*(.+)$/);
                    if (match) {
                        return {
                            storeId: parseInt(match[1]),
                            storeName: match[2]
                        };
                    }
                    return { storeId: 0, storeName: entry };
                });
                setAllEntries(parsedEntries);

                const maxLength = calculateMaxTextLength(parsedEntries.length);
                const wheelEntries = parsedEntries.map((entry, i) => {
                    const displayText = `${entry.storeId}. ${entry.storeName}`;
                    return {
                        option: displayText.length > maxLength ? displayText.substring(0, maxLength) + '...' : displayText,
                        style: {
                            backgroundColor: COLORS[i % COLORS.length],
                            textColor: 'white'
                        }
                    };
                });
                setWheelData(wheelEntries);

                const typeLabel = type ? (type === 'Nisit' ? 'นิสิต' : 'ชุมนุม') : 'ทั้งหมด';
                toast.success(`รีเฟรชรายชื่อเรียบร้อย (${typeLabel}): เหลือ ${parsedEntries.length} ร้าน`);

                // ตั้งค่าว่าไม่ใช่ mock mode
                setIsMockMode(false);

                // ตรวจสอบ booth availability
                await checkAvailability();
            } else {
                setAllEntries([]);
                setWheelData([{ option: 'ไม่มีร้านค้าที่ยังไม่ถูกสุ่ม', style: { backgroundColor: '#ccc', textColor: '#666' } }]);
                const typeLabel = type ? (type === 'Nisit' ? 'นิสิต' : 'ชุมนุม') : '';
                toast.info(`ไม่มีร้านค้า${typeLabel}ที่ยังไม่ถูกสุ่ม`);
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
        const mockStores: StoreEntry[] = [
            { storeId: 1, storeName: 'ร้านกาแฟสดใจกลางเมือง' },
            { storeId: 2, storeName: 'ร้านขนมหวานแสนอร่อย' },
            { storeId: 3, storeName: 'ร้านอาหารเจ้าเด็ด' },
            { storeId: 4, storeName: 'ร้านเสื้อผ้าแฟชั่น' },
            { storeId: 5, storeName: 'ร้านของใช้ในบ้าน' },
            { storeId: 6, storeName: 'ร้านหนังสือและเครื่องเขียน' },
            { storeId: 7, storeName: 'ร้านดอกไม้บานสวย' },
            { storeId: 8, storeName: 'ร้านขายพืชสวนถูกใจ' },
            { storeId: 9, storeName: 'ร้านขนมไทยโบราณ' },
            { storeId: 10, storeName: 'ร้านเบเกอรี่หอมกรุ่น' },
            { storeId: 11, storeName: 'ร้านน้ำผลไม้สดใหม่' },
            { storeId: 12, storeName: 'ร้านอุปกรณ์กีฬา' },
            { storeId: 13, storeName: 'ร้านของเล่นเด็ก' },
            { storeId: 14, storeName: 'ร้านเครื่องประดับ' },
            { storeId: 15, storeName: 'ร้านรองเท้าคุณภาพ' }
        ];

        setAllEntries(mockStores);

        const maxLength = calculateMaxTextLength(mockStores.length);
        const wheelEntries = mockStores.map((entry, i) => {
            const displayText = `${entry.storeId}. ${entry.storeName}`;
            return {
                option: displayText.length > maxLength ? displayText.substring(0, maxLength) + '...' : displayText,
                style: {
                    backgroundColor: COLORS[i % COLORS.length],
                    textColor: 'white'
                }
            };
        });
        setWheelData(wheelEntries);

        toast.success(`โหลด Mock Data ${mockStores.length} ร้านเรียบร้อยแล้ว (ทดสอบ)`);

        // ตั้งค่าว่าอยู่ใน mock mode
        setIsMockMode(true);
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
        const winnerText = `${winner.storeId}. ${winner.storeName}`;
        setWinnerName(winnerText);

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

        // ⏳ บันทึก winner (เฉพาะเมื่อไม่ใช่ mock mode)
        if (!isMockMode) {
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
        } else {
            // Mock mode - แสดงข้อความว่าไม่ได้บันทึก
            toast.info('🧪 โหมดทดสอบ: ไม่ได้บันทึกข้อมูลลง database');
        }

        // ✅ ลบผู้ชนะออกจากรายชื่อเสมอ (เพราะ backend เก็บ winner ไว้แล้ว)
        const updatedEntries = allEntries.filter(entry => `${entry.storeId}. ${entry.storeName}` !== winnerName);
        setAllEntries(updatedEntries);

        // อัปเดตข้อมูลวงล้อ
        if (updatedEntries.length > 0) {
            const maxLength = calculateMaxTextLength(updatedEntries.length);
            const updatedWheelData = updatedEntries.map((entry, i) => {
                const displayText = `${entry.storeId}. ${entry.storeName}`;
                return {
                    option: displayText.length > maxLength ? displayText.substring(0, maxLength) + '...' : displayText,
                    style: {
                        backgroundColor: COLORS[i % COLORS.length],
                        textColor: 'white'
                    }
                };
            });
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
            className={`bg-white p-6 rounded-2xl shadow-xl border border-gray-100 ${isFullscreen
                ? 'h-screen w-screen fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-purple-50 flex flex-row gap-6'
                : 'h-[700px] flex flex-col'
                }`}
        >
            {/* Main Wheel Section */}
            <div className={`flex flex-col ${isFullscreen && showWinnersInFullscreen ? 'flex-1' : 'w-full'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                        <span className="text-2xl">🎡</span> Lucky Draw Wheel
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowConfigModal(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-700 flex items-center gap-2"
                            title="ตั้งค่าวงล้อ"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="text-sm font-medium">ตั้งค่า</span>
                        </button>
                        {isFullscreen && (
                            <button
                                onClick={() => setShowWinnersInFullscreen(!showWinnersInFullscreen)}
                                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${showWinnersInFullscreen ? 'text-purple-600 hover:text-purple-700' : 'text-gray-600 hover:text-gray-700'
                                    }`}
                                title={showWinnersInFullscreen ? 'ซ่อน Winners' : 'แสดง Winners'}
                            >
                                <Trophy className="w-5 h-5" />
                                <span className="text-sm font-medium">{showWinnersInFullscreen ? 'ซ่อน Winners' : 'แสดง Winners'}</span>
                            </button>
                        )}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-green-600 hover:text-green-700 flex items-center gap-2"
                            title={isFullscreen ? 'ออกจากโหมดเต็มจอ' : 'ขยายเต็มจอ'}
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            <span className="text-sm font-medium">{isFullscreen ? 'ย่อ' : 'ขยาย'}</span>
                        </button>
                        {/* Refresh Button with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowRefreshMenu(!showRefreshMenu)}
                                disabled={loadingStores}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700 flex items-center gap-2 disabled:opacity-50"
                                title="รีเฟรชรายชื่อร้านที่ยังไม่ถูกสุ่ม"
                            >
                                <RefreshCw className={`w-5 h-5 ${loadingStores ? 'animate-spin' : ''}`} />
                                <span className="text-sm font-medium">
                                    รีเฟรช ({selectedStoreType === 'ALL' ? 'ทั้งหมด' : selectedStoreType === 'Nisit' ? 'นิสิต' : 'ชุมนุม'})
                                </span>
                            </button>

                            {/* Refresh Dropdown Menu */}
                            {showRefreshMenu && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowRefreshMenu(false)}
                                    />

                                    {/* Menu Items */}
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                            เลือกประเภทร้าน
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedStoreType('ALL');
                                                refreshActiveEntries(undefined);
                                                setShowRefreshMenu(false);
                                            }}
                                            disabled={loadingStores}
                                            className={`w-full px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 disabled:opacity-50 text-left ${selectedStoreType === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                                }`}
                                        >
                                            <span className="text-xl">🏪</span>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-sm font-medium">ทั้งหมด</span>
                                                <span className="text-xs text-gray-500">นิสิต + ชุมนุม</span>
                                            </div>
                                            {selectedStoreType === 'ALL' && <span className="text-blue-600">✓</span>}
                                        </button>

                                        <div className="h-px bg-gray-200 my-1" />

                                        <button
                                            onClick={() => {
                                                setSelectedStoreType('Nisit');
                                                refreshActiveEntries('Nisit');
                                                setShowRefreshMenu(false);
                                            }}
                                            disabled={loadingStores}
                                            className={`w-full px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3 disabled:opacity-50 text-left ${selectedStoreType === 'Nisit' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                                }`}
                                        >
                                            <span className="text-xl">🎓</span>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-sm font-medium">นิสิต</span>
                                                <span className="text-xs text-gray-500">ร้านค้านิสิต</span>
                                            </div>
                                            {selectedStoreType === 'Nisit' && <span className="text-green-600">✓</span>}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setSelectedStoreType('Club');
                                                refreshActiveEntries('Club');
                                                setShowRefreshMenu(false);
                                            }}
                                            disabled={loadingStores}
                                            className={`w-full px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 disabled:opacity-50 text-left ${selectedStoreType === 'Club' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                                }`}
                                        >
                                            <span className="text-xl">🎪</span>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-sm font-medium">ชุมนุม</span>
                                                <span className="text-xs text-gray-500">ร้านค้าชุมนุม</span>
                                            </div>
                                            {selectedStoreType === 'Club' && <span className="text-purple-600">✓</span>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-700 flex items-center gap-2"
                                title="ตัวเลือกเพิ่มเติม"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* Dropdown Menu */}
                            {showMoreMenu && (
                                <>
                                    {/* Backdrop to close menu when clicking outside */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowMoreMenu(false)}
                                    />

                                    {/* Menu Items */}
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                        <button
                                            onClick={() => {
                                                loadWheelData();
                                                setShowMoreMenu(false);
                                            }}
                                            disabled={loadingStores}
                                            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-orange-600 hover:text-orange-700 flex items-center gap-3 disabled:opacity-50 text-left"
                                            title="โหลดรายชื่อร้านใหม่ทั้งหมดจาก database (reset entries)"
                                        >
                                            <RotateCcw className={`w-5 h-5 ${loadingStores ? 'animate-spin' : ''}`} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">รีเซ็ทผลลัพธ์</span>
                                                <span className="text-xs text-gray-500">โหลดร้านค้าใหม่ทั้งหมด</span>
                                            </div>
                                        </button>

                                        <div className="h-px bg-gray-200 my-1" />

                                        <button
                                            onClick={() => {
                                                loadMockData();
                                                setShowMoreMenu(false);
                                            }}
                                            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-purple-600 hover:text-purple-700 flex items-center gap-3 text-left"
                                        >
                                            <span className="text-xl">🧪</span>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Mock Data</span>
                                                <span className="text-xs text-gray-500">ทดสอบด้วย 15 ร้าน</span>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    {!isFullscreen && (
                        <div className="text-center space-y-2">
                            <p className="text-lg font-semibold text-gray-700">
                                จำนวนร้านค้าทั้งหมด: <span className="text-blue-600">{allEntries.length}</span> ร้าน
                            </p>
                            {isMockMode && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 border-2 border-purple-300 rounded-lg">
                                    <span className="text-xl">🧪</span>
                                    <span className="text-sm font-bold text-purple-700">โหมดทดสอบ (Mock Data)</span>
                                </div>
                            )}
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
                            spinDuration={spinDuration} // ความเร็ว (ปรับได้จาก config)
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
            </div>

            {/* Winners Display in Fullscreen */}
            {isFullscreen && showWinnersInFullscreen && (
                <div className="w-[600px] flex-shrink-0">
                    <WinnersDisplay
                        winners={winners}
                        latestWinner={winners[0]?.winner}
                        onRefresh={onRefreshWinners}
                        className="h-full"
                    />
                </div>
            )}

            {/* ⚙️ Config Modal */}
            {showConfigModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowConfigModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-gray-600" />
                                ตั้งค่าวงล้อ
                            </h3>
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Speed Control */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ⚡ ความเร็วการหมุน
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0.3"
                                        max="3"
                                        step="0.1"
                                        value={spinDuration}
                                        onChange={(e) => setSpinDuration(parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <span className="text-lg font-semibold text-blue-600 min-w-[60px] text-center">
                                        {spinDuration.toFixed(1)}s
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>เร็ว (0.3s)</span>
                                    <span>ช้า (3.0s)</span>
                                </div>
                            </div>

                            {/* Preset Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setSpinDuration(0.5)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${spinDuration === 0.5
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    🚀 เร็ว
                                </button>
                                <button
                                    onClick={() => setSpinDuration(0.8)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${spinDuration === 0.8
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    ⚡ ปกติ
                                </button>
                                <button
                                    onClick={() => setSpinDuration(1.5)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${spinDuration === 1.5
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    🐢 ช้า
                                </button>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                                <p className="text-xs text-blue-800">
                                    💡 <strong>คำแนะนำ:</strong> ความเร็วปกติ (0.8s) เหมาะสำหรับการใช้งานทั่วไป
                                    ความเร็วช้า (1.5s+) จะสร้างความตื่นเต้นมากขึ้น
                                </p>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowConfigModal(false)}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
                        >
                            บันทึกการตั้งค่า
                        </button>
                    </div>
                </div>
            )}

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
