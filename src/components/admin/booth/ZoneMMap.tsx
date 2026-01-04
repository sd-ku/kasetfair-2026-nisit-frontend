import React from 'react';
import { BoothResponse } from '@/services/admin/boothService';
import { Package, Utensils } from 'lucide-react';

interface ZoneMMapProps {
    booths: BoothResponse[];
    onBoothClick?: (booth: BoothResponse) => void;
}

export const ZoneMMap: React.FC<ZoneMMapProps> = ({ booths, onBoothClick }) => {
    // Helper to get booth by number
    const getBooth = (num: string) => booths.find(b => b.boothNumber === num);

    // Helper to render a generic booth
    const renderBooth = (num: number, prefix = 'M', orientation: 'horizontal' | 'vertical' = 'horizontal') => {
        const boothNumber = `${prefix}${num}`;
        const booth = getBooth(boothNumber);

        // If booth doesn't exist in data, render a placeholder or empty
        const status = booth?.isAssigned
            ? booth.assignment?.status
            : 'AVAILABLE';

        // Colors based on status
        let bgClass = 'bg-gray-100 border-gray-300 hover:bg-gray-200';
        let textClass = 'text-gray-600';

        if (booth) {
            if (!booth.isAssigned) {
                bgClass = 'bg-white border-blue-200 hover:bg-blue-50';
                textClass = 'text-gray-900';
            } else if (status === 'CONFIRMED') {
                bgClass = 'bg-green-500 border-green-600 text-white';
                textClass = 'text-white';
            } else if (status === 'PENDING') {
                bgClass = 'bg-yellow-400 border-yellow-500 text-black';
                textClass = 'text-black';
            } else {
                // Rejected or other
                bgClass = 'bg-red-500 border-red-600 text-white';
                textClass = 'text-white';
            }
        } else {
            // Not in DB
            bgClass = 'bg-gray-200 border-gray-300 opacity-50';
        }

        const sizeClass = orientation === 'vertical' ? 'w-16 h-10' : 'w-10 h-14';

        return (
            <div
                key={boothNumber}
                onClick={(e) => {
                    e.stopPropagation();
                    if (booth) onBoothClick?.(booth);
                }}
                className={`
                    ${sizeClass} flex flex-col items-center justify-center 
                    border rounded-md text-[10px] font-bold cursor-pointer transition-all
                    ${bgClass}
                    relative
                    group
                    shrink-0
                `}
                title={booth ? `${booth.boothNumber} - ${booth.zone} (${booth.isAssigned ? booth.assignment?.store?.storeName : 'ว่าง'})` : `Booth ${boothNumber}`}
            >
                <div>{boothNumber}</div>
                {/* Tooltip */}
                {booth && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-max max-w-[200px]">
                        <div className="bg-black text-white text-xs rounded py-1 px-2 shadow-lg text-center">
                            <p className="font-bold text-sm">{booth.boothNumber}</p>
                            <p>{booth.zone}</p>
                            {booth.isAssigned && (
                                <>
                                    <hr className="my-1 border-gray-600" />
                                    <p className="font-medium text-yellow-300 truncate">{booth.assignment?.store?.storeName}</p>
                                    <p className="opacity-80">{booth.assignment?.status}</p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Layout configuration for "Inverted T"
    // Stem (Vertical part): Booths 1-80 (2 columns: 1-40 Left, 41-80 Right)
    // Base (Horizontal part): Booths 81-265 (Top Row: 81-172, Bottom Row: 173-265)

    const stemLeft = Array.from({ length: 40 }, (_, i) => 40 - i); // 40 down to 1 (Bottom-up numbering visually)
    const stemRight = Array.from({ length: 40 }, (_, i) => 41 + i); // 41 to 80

    const baseTop = Array.from({ length: 92 }, (_, i) => 81 + i); // 81 - 172
    const baseBottom = Array.from({ length: 93 }, (_, i) => 173 + i); // 173 - 265

    return (
        <div className="w-full overflow-x-auto bg-gray-50 border rounded-xl p-8 min-h-[800px] flex flex-col items-center">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">แผนผังโซน M (Inverted T-Shape)</h2>
                <p className="text-gray-500">จำนวนรวม 265 ล็อค</p>
            </div>

            <div className="relative p-4 flex flex-col items-center">

                {/* --- STEM SECTION (Vertical) --- */}
                <div className="flex gap-16 mb-4">
                    {/* Left Stem Column */}
                    <div className="flex flex-col gap-2 bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                        {stemLeft.map(n => renderBooth(n, 'M', 'vertical'))}
                    </div>

                    {/* Walkway Center Vertical */}
                    <div className="w-20 hidden md:flex items-center justify-center">
                        <span className="transform -rotate-90 text-gray-400 font-bold tracking-widest text-lg whitespace-nowrap">ทางเดินหลัก</span>
                    </div>

                    {/* Right Stem Column */}
                    <div className="flex flex-col gap-2 bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                        {stemRight.map(n => renderBooth(n, 'M', 'vertical'))}
                    </div>
                </div>

                {/* --- INTERSECTION / LANDMARK --- */}
                <div className="w-full max-w-4xl h-24 bg-blue-50 border-2 border-blue-200 rounded-xl my-4 flex items-center justify-center text-blue-800 font-bold mb-8">
                    <span className="text-xl">ลานกิจกรรมกลาง / เวที</span>
                </div>


                {/* --- BASE SECTION (Horizontal) --- */}
                <div className="flex flex-col gap-8 w-full">
                    {/* Top Base Row */}
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 flex gap-2 flex-wrap justify-center max-w-[1200px]">
                            {baseTop.map(n => renderBooth(n))}
                        </div>
                    </div>

                    {/* Walkway Horizontal */}
                    <div className="h-8 flex items-center justify-center">
                        <span className="text-gray-400 font-bold tracking-widest text-lg">ถนน / ทางเดินล่าง</span>
                    </div>

                    {/* Bottom Base Row */}
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 flex gap-2 flex-wrap justify-center max-w-[1200px]">
                            {baseBottom.map(n => renderBooth(n))}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="fixed bottom-8 right-8 bg-white p-4 rounded-xl shadow-xl border border-gray-200 z-40 max-w-xs">
                    <h3 className="font-bold text-gray-800 mb-2">สัญลักษณ์สี</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-500 border border-green-600"></div>
                            <span>ยืนยันแล้ว ({booths.filter(b => b.assignment?.status === 'CONFIRMED').length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-500"></div>
                            <span>รอตรวจสอบ ({booths.filter(b => b.assignment?.status === 'PENDING').length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-white border border-blue-300"></div>
                            <span>ว่าง ({booths.filter(b => !b.isAssigned).length})</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
