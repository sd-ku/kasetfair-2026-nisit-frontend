'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Maximize2, X } from 'lucide-react';

export interface WinnerEntry {
    id: number;
    winner: string;
    boothNumber?: string;
    status?: 'CONFIRMED' | 'PENDING' | 'FORFEITED';
    createdAt: string;
}

interface WinnersDisplayProps {
    winners: WinnerEntry[];
    latestWinner?: string;
    onRefresh?: () => void;
    className?: string;
}

export function WinnersDisplay({
    winners,
    latestWinner,
    onRefresh,
    className = '',
}: WinnersDisplayProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Handle ESC key to exit fullscreen
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen]);

    const content = (
        <div className={`bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col ${isFullscreen ? 'h-full' : 'h-[700px]'} ${className}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className={`font-semibold text-gray-700 flex items-center gap-2 ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                    <span className={isFullscreen ? 'text-4xl' : 'text-2xl'}>🏆</span> Winners History
                </h2>
                <div className="flex gap-2">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {latestWinner && (
                <div className={`mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl text-center shadow-sm animate-bounce ${isFullscreen ? 'p-12' : 'p-8'}`}>
                    <p className={`text-orange-600 uppercase tracking-wide font-bold mb-1 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>
                        🎉 Recent Winner 🎉
                    </p>
                    <p className={`font-extrabold text-gray-800 break-words ${isFullscreen ? 'text-6xl lg:text-8xl' : 'text-4xl lg:text-5xl'}`}>
                        {latestWinner}
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr>
                            <th className={`px-4 py-3 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                                No.
                            </th>
                            <th className={`px-4 py-3 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                                Name
                            </th>
                            <th className={`px-4 py-3 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-center ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                                Booth
                            </th>
                            <th className={`px-4 py-3 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-center ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                                Status
                            </th>
                            <th className={`px-4 py-3 font-bold text-gray-400 text-right uppercase tracking-wider border-b border-gray-100 ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                                Time
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {winners.map((w, index) => (
                            <tr key={w.id} className="group hover:bg-gray-50">
                                <td className={`px-4 py-4 text-gray-400 font-mono ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
                                    #{winners.length - index}
                                </td>
                                <td className={`px-4 py-4 font-semibold text-gray-700 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                                    {w.winner}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {w.boothNumber ? (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-800 ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
                                            {w.boothNumber}
                                        </span>
                                    ) : (
                                        <span className={`text-gray-400 ${isFullscreen ? 'text-base' : 'text-sm'}`}>-</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {w.status === 'CONFIRMED' ? (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-green-600 text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                                            ✓ ยืนยันแล้ว
                                        </span>
                                    ) : w.status === 'PENDING' ? (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                                            ⏳ รอยืนยัน
                                        </span>
                                    ) : w.status === 'FORFEITED' ? (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-800 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                                            ✗ สละสิทธิ์
                                        </span>
                                    ) : (
                                        <span className={`text-gray-400 ${isFullscreen ? 'text-base' : 'text-sm'}`}>-</span>
                                    )}
                                </td>
                                <td className={`px-4 py-4 text-right text-gray-500 ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                                    {new Date(w.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                <div className="w-full h-full max-w-7xl">
                    {content}
                </div>
            </div>
        );
    }

    return content;
}
