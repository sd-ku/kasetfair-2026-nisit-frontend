'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createLuckyDrawWinner, getLuckyDrawWinners, LuckyDrawResponse, generateWheel, getActiveEntries, resetWheel } from '@/services/admin/luckyDrawService';
import { Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function LuckyDrawPage() {
    const [winners, setWinners] = useState<LuckyDrawResponse[]>([]);
    const [latestWinner, setLatestWinner] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loadingStores, setLoadingStores] = useState(false);

    // ใช้ useRef แทน document.getElementById (React Best Practice)
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const wheelContainerRef = useRef<HTMLDivElement>(null);

    const fetchWinners = async () => {
        try {
            const data = await getLuckyDrawWinners();
            setWinners(data);
        } catch (error) {
            console.error('Failed to fetch winners', error);
        }
    };

    // โหลดรายชื่อร้านจาก Backend และเติมลงวงล้อ
    const loadEntriesToWheel = async (entries: string[]) => {
        if (!iframeRef.current || !iframeRef.current.contentWindow) {
            console.warn('Iframe not ready yet');
            return;
        }

        // ส่งข้อมูลไปที่ iframe ด้วย postMessage
        iframeRef.current.contentWindow.postMessage({
            name: 'setEntries',
            entries: entries
        }, 'https://wheelofnames.com');
    };

    const handleAutoFill = async () => {
        try {
            setLoadingStores(true);

            // เรียก Backend API เพื่อโหลดร้านค้าและบันทึกลง database
            const response = await generateWheel({
                state: 'Validated'
            });

            // เติมข้อมูลลงวงล้อ
            await loadEntriesToWheel(response.entries);

            toast.success(`โหลดข้อมูล ${response.totalStores} ร้านค้าเรียบร้อยแล้ว`);
        } catch (error: any) {
            console.error('Failed to generate wheel', error);
            const errorMessage = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างวงล้อ';
            toast.error(errorMessage);
        } finally {
            setLoadingStores(false);
        }
    };

    const handleReset = async () => {
        try {
            await resetWheel();
            // ล้างวงล้อ
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    name: 'setEntries',
                    entries: []
                }, 'https://wheelofnames.com');
            }
            toast.success('รีเซ็ตวงล้อเรียบร้อยแล้ว');
        } catch (error) {
            console.error('Failed to reset wheel', error);
            toast.error('เกิดข้อผิดพลาดในการรีเซ็ตวงล้อ');
        }
    };

    const toggleFullscreen = () => {
        // ใช้ ref แทน getElementById
        const wheelContainer = wheelContainerRef.current;

        if (!isFullscreen) {
            // Enter fullscreen
            if (wheelContainer?.requestFullscreen) {
                wheelContainer.requestFullscreen();
            } else if ((wheelContainer as any)?.webkitRequestFullscreen) {
                (wheelContainer as any).webkitRequestFullscreen();
            } else if ((wheelContainer as any)?.msRequestFullscreen) {
                (wheelContainer as any).msRequestFullscreen();
            }
            setIsFullscreen(true);
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        fetchWinners();

        // โหลด active entries จาก database เมื่อ component mount
        // (กรณี refresh หน้า จะได้กู้คืนข้อมูลวงล้อ)
        const loadActiveEntries = async () => {
            try {
                const entries = await getActiveEntries();
                if (entries.length > 0) {
                    // รอให้ iframe โหลดเสร็จก่อน
                    setTimeout(() => {
                        loadEntriesToWheel(entries);
                    }, 1000);
                }
            } catch (error) {
                console.error('Failed to load active entries', error);
            }
        };

        loadActiveEntries();

        const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== "https://wheelofnames.com") {
                return;
            }

            console.log("Received data from wheel:", event.data);

            // Adapt based on actual payload. Using event.data.winner as per user suggestion.
            const winnerName = event.data?.winner;

            if (winnerName && typeof winnerName === 'string') {
                setLatestWinner(winnerName);
                try {
                    // Play a sound or show a confetti here if desired
                    await createLuckyDrawWinner(winnerName);
                    fetchWinners(); // Refresh list
                } catch (error) {
                    console.error("Failed to save winner", error);
                }
            }
        };

        // Handle fullscreen change events
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
        };

        window.addEventListener("message", handleMessage);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener("message", handleMessage);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 animate-fade-in-down">Lucky Draw System</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Wheel Section */}
                <div
                    ref={wheelContainerRef}
                    className={`transition-all duration-300 ${isFullscreen
                        ? 'fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col'
                        : 'bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[700px]'
                        }`}
                >
                    {!isFullscreen && (
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                                <span className="text-2xl">🎡</span> Wheel of Names
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAutoFill}
                                    disabled={loadingStores}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700 flex items-center gap-2 disabled:opacity-50"
                                    title="Auto Fill Stores"
                                >
                                    {loadingStores ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-5 h-5" />
                                    )}
                                    <span className="text-sm font-medium">โหลดรายชื่อร้าน</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600 hover:text-red-700 flex items-center gap-2"
                                    title="Reset Wheel"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span className="text-sm font-medium">รีเซ็ต</span>
                                </button>
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-2"
                                    title="ขยายเต็มจอ"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                                    </svg>
                                    <span className="text-sm font-medium">ขยายเต็มจอ</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* {isFullscreen && (
                        <button
                            onClick={toggleFullscreen}
                            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-110 flex items-center justify-center w-10 h-10 border border-gray-600"
                            title="Exit Fullscreen"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )} */}

                    <div className={`flex-1 w-full bg-gray-50 overflow-hidden relative ${!isFullscreen ? 'rounded-xl' : ''}`}>
                        <iframe
                            ref={iframeRef}
                            src="https://wheelofnames.com/th/"
                            className="absolute inset-0 w-full h-full border-0"
                            title="Wheel of Names"
                        >
                        </iframe>
                    </div>
                    {!isFullscreen && (
                        <p className="mt-4 text-xs text-gray-400 text-center">
                            *Ensure the iframe src corresponds to your saved wheel URL.
                        </p>
                    )}
                </div>

                {/* Winners Section */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[700px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <span className="text-2xl">🏆</span> Winners History
                        </h2>
                        <button
                            onClick={fetchWinners}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            title="Refresh"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                        </button>
                    </div>

                    {latestWinner && (
                        <div className="mb-6 p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl text-center shadow-sm animate-bounce">
                            <p className="text-sm text-orange-600 uppercase tracking-wide font-bold mb-1">🎉 Recent Winner 🎉</p>
                            <p className="text-5xl font-extrabold text-gray-800 break-words">{latestWinner}</p>
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
                                    <tr key={w.id} className="group hover:bg-gray-50 transition-all duration-200">
                                        <td className="px-4 py-4 text-gray-400 text-sm font-mono">#{winners.length - index}</td>
                                        <td className="px-4 py-4 font-semibold text-gray-700 text-lg">{w.winner}</td>
                                        <td className="px-4 py-4 text-right text-gray-500 text-sm">
                                            {new Date(w.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                                {winners.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-gray-400 italic">
                                            No winners yet. Spin the wheel to start!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
