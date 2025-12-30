'use client';

import React, { useState, useEffect } from 'react';
import {
    Store,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
    FileCheck,
    ClipboardCheck,
    Package,
    Users,
    ChevronRight,
    Search,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Map,
    FileText,
    Utensils,
    Undo2,
    ChevronLeft,
    Sparkles,
    Zap,
    Eye,
    ListChecks,
    GitMerge,
    Info,
    MessageSquare,
    MessageSquareText
} from 'lucide-react';
import {
    findAllStores,
    updateStoreStatus,
    getStats,
    validateAllStores,
    validateSingleStore,
    mergeAllReviewStatus,
    mergeSingleReviewStatus
} from '@/services/admin/reviewStoreService';
import { getMediaInfo } from '@/services/admin/mediaService';
import { AdminStoreDto, PaginationMetaDto, ReviewStatus } from '@/services/admin/dto/review-store.dto';
import { StatsResponseDto } from '@/services/admin/dto/stats-store.dto';
import { StoreState, StoreType } from '@/services/dto/store-info.dto';
import { toast } from 'sonner';

export default function StoresPage() {
    const [stores, setStores] = useState<AdminStoreDto[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [expandedGoodsRow, setExpandedGoodsRow] = useState<number | null>(null);
    const [expandedReviewRow, setExpandedReviewRow] = useState<number | null>(null);
    const [expandedQuestionsRow, setExpandedQuestionsRow] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<StatsResponseDto>({
        total: 0,
        validated: 0,
        pending: 0,
        rejected: 0
    });
    const [pagination, setPagination] = useState<PaginationMetaDto>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<StoreState | undefined>(undefined);
    const [typeFilter, setTypeFilter] = useState<StoreType | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortFilter, setSortFilter] = useState<'id' | 'name'>('id');
    const [updatingStoreId, setUpdatingStoreId] = useState<number | null>(null);
    const [goodImageUrls, setGoodImageUrls] = useState<Record<string, string>>({});
    const [validating, setValidating] = useState(false);
    const [validatingStoreId, setValidatingStoreId] = useState<number | null>(null);
    const [mergingAll, setMergingAll] = useState(false);
    const [mergingStoreId, setMergingStoreId] = useState<number | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

    // Fetch stores from API
    const fetchStores = async (page: number = 1, status?: StoreState, type?: StoreType, search?: string, sort?: 'id' | 'name') => {
        try {
            setLoading(true);
            setError(null);
            const response = await findAllStores({
                page,
                limit: 10,
                status,
                type,
                search,
                sort
            });
            setStores(response.data);
            setPagination(response.meta);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats from API
    const fetchStats = async () => {
        try {
            const statsData = await getStats();
            setStats(statsData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดสถิติ';
            console.error(errorMessage);
        }
    };

    // Initial load
    useEffect(() => {
        fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter);
        fetchStats();
    }, [currentPage, statusFilter, typeFilter, searchQuery, sortFilter]);

    const toggleMembers = (id: number) => {
        const newExpandedId = expandedRow === id ? null : id;
        setExpandedRow(newExpandedId);
        // Close goods section when opening members
        if (newExpandedId !== null) {
            setExpandedGoodsRow(null);
        }
    };

    const toggleGoods = async (id: number) => {
        const newExpandedId = expandedGoodsRow === id ? null : id;
        setExpandedGoodsRow(newExpandedId);
        // Close members section when opening goods
        if (newExpandedId !== null) {
            setExpandedRow(null);
        }

        // Load images when expanding
        if (newExpandedId !== null) {
            const store = stores.find(s => s.id === newExpandedId);
            if (store && store.goods.length > 0) {
                const goodsWithMedia = store.goods.filter(g => g.googleMedia?.id);
                if (goodsWithMedia.length > 0) {
                    try {
                        const entries = await Promise.all(
                            goodsWithMedia.map(async (good) => {
                                try {
                                    const media = await getMediaInfo(good.googleMedia.id);
                                    return { id: good.id, url: media.link ?? "" };
                                } catch (error) {
                                    console.error(`Failed to load media for good ${good.googleMedia.id}`, error);
                                    return { id: good.id, url: "" };
                                }
                            })
                        );

                        setGoodImageUrls(prev => {
                            const next = { ...prev };
                            entries.forEach(entry => {
                                if (entry.url) next[entry.id] = entry.url;
                            });
                            return next;
                        });
                    } catch (error) {
                        console.error("Failed to load goods media", error);
                    }
                }
            }
        }
    };

    const handleStatusChange = async (id: number, targetState: StoreState) => {
        try {
            setUpdatingStoreId(id);
            await updateStoreStatus(id, targetState);

            // Update local state
            setStores(stores.map(store =>
                store.id === id ? { ...store, state: targetState } : store
            ));

            toast.success(`อัพเดทสถานะร้านค้าเรียบร้อยแล้ว`);

            // Refresh data to get updated stats
            await fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter);
            await fetchStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัพเดทสถานะ';
            toast.error(errorMessage);
        } finally {
            setUpdatingStoreId(null);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleViewMedia = async (mediaId: string | null, documentType: string) => {
        if (!mediaId) {
            toast.error(`ไม่พบ${documentType}`);
            return;
        }

        try {
            const mediaInfo = await getMediaInfo(mediaId);
            if (mediaInfo.link) {
                window.open(mediaInfo.link, '_blank');
            } else {
                toast.error(`ไม่สามารถเปิด${documentType}ได้`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `เกิดข้อผิดพลาดในการเปิด${documentType}`;
            toast.error(errorMessage);
        }
    };

    // Validate all stores
    const handleValidateAll = async () => {
        try {
            setValidating(true);
            const result = await validateAllStores();

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="font-semibold">{result.message}</div>
                    <div className="text-xs opacity-80">
                        ตรวจสอบแล้ว {result.validatedStores}/{result.totalStores} ร้าน
                        {result.createdDrafts > 0 && ` • สร้าง ${result.createdDrafts} drafts`}
                    </div>
                </div>
            );

            // Refresh data
            await fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter);
            await fetchStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการ validate';
            toast.error(errorMessage);
        } finally {
            setValidating(false);
        }
    };

    // Merge all review status
    const handleMergeAll = async () => {
        try {
            setMergingAll(true);
            const result = await mergeAllReviewStatus();

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="font-semibold">Merge สถานะสำเร็จ</div>
                    <div className="text-xs opacity-80">
                        อัพเดทสถานะร้านค้าจาก review drafts เรียบร้อยแล้ว
                    </div>
                </div>
            );

            // Refresh data
            await fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter);
            await fetchStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการ merge';
            toast.error(errorMessage);
        } finally {
            setMergingAll(false);
        }
    };

    // Merge single store review status
    const handleMergeSingle = async (id: number) => {
        try {
            setMergingStoreId(id);
            const result = await mergeSingleReviewStatus(id);

            toast.success(`Merge สถานะร้าน #${id} สำเร็จ`);

            // Refresh data
            await fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter);
            await fetchStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการ merge';
            toast.error(errorMessage);
        } finally {
            setMergingStoreId(null);
        }
    };

    // Manual update store status
    const handleUpdateStatus = async (id: number, status: StoreState) => {
        try {
            setUpdatingStatusId(id);
            await updateStoreStatus(id, status);

            const statusLabel = status === 'Pending' ? 'Pending' : 'Rejected';
            toast.success(`อัพเดทสถานะร้าน #${id} เป็น ${statusLabel} สำเร็จ`);

            // Refresh data
            await fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter);
            await fetchStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัพเดทสถานะ';
            toast.error(errorMessage);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // Validate single store
    const handleValidateSingle = async (id: number) => {
        try {
            setValidatingStoreId(id);
            const result = await validateSingleStore(id);

            toast.success(
                <div className="flex flex-col gap-1">
                    <div className="font-semibold">Validate ร้าน #{id} สำเร็จ</div>
                    <div className="text-xs opacity-80">
                        {result.message}
                    </div>
                </div>
            );

            // Refresh data
            await fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter);
            await fetchStats();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการ validate';
            toast.error(errorMessage);
        } finally {
            setValidatingStoreId(null);
        }
    };

    // Toggle review details
    const toggleReviewDetails = (id: number) => {
        const newExpandedId = expandedReviewRow === id ? null : id;
        setExpandedReviewRow(newExpandedId);
        // Close other sections when opening review details
        if (newExpandedId !== null) {
            setExpandedRow(null);
            setExpandedGoodsRow(null);
            setExpandedQuestionsRow(null); // Close questions when opening review details
        }
    };

    // Toggle questions
    const toggleQuestions = (id: number) => {
        const newExpandedId = expandedQuestionsRow === id ? null : id;
        setExpandedQuestionsRow(newExpandedId);
        // Close other sections when opening questions
        if (newExpandedId !== null) {
            setExpandedRow(null);
            setExpandedGoodsRow(null);
            setExpandedReviewRow(null); // Close review details when opening questions
        }
    };

    // Map StoreState to display status
    const getStatusDisplay = (state: StoreState) => {
        const statusMap: Partial<Record<StoreState, { label: string; className: string }>> = {
            'CreateStore': { label: 'สร้างร้าน', className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' },
            'ClubInfo': { label: 'ข้อมูลชุมนุม', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
            'StoreDetails': { label: 'รายละเอียดร้าน', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
            'ProductDetails': { label: 'รายละเอียดสินค้า', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
            'Submitted': { label: 'ส่งแล้ว', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
            'Pending': { label: 'รอดำเนินการ', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
            'Validated': { label: 'อนุมัติแล้ว', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
            'Rejected': { label: 'ถูกปฏิเสธ', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
            'deleted': { label: 'ถูกลบ', className: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700' }
        };
        return statusMap[state] || { label: state, className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' };
    };

    // Map ReviewStatus to display status
    const getReviewStatusDisplay = (status: ReviewStatus) => {
        const statusMap: Record<ReviewStatus, { label: string; className: string }> = {
            'NeedFix': { label: 'ต้องแก้ไข', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
            'Pending': { label: 'รอจับฉลาก', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
            'Rejected': { label: 'ถูกปฏิเสธ', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
            'deleted': { label: 'ถูกลบ', className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' }
        };
        return statusMap[status];
    };

    return (
        <>
            {/* Header */}
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 py-11 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Store Management</h1>
                        <p className="text-xs text-muted-foreground">จัดการและตรวจสอบร้านค้าทั้งหมด</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Merge All Button */}
                    <button
                        onClick={handleMergeAll}
                        disabled={mergingAll || loading}
                        className="group relative px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2.5 overflow-hidden"
                    >
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                        {/* Content */}
                        <div className="relative flex items-center gap-2.5">
                            {mergingAll ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>กำลัง Merge...</span>
                                </>
                            ) : (
                                <>
                                    <GitMerge className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                    <span>Merge All Review</span>
                                </>
                            )}
                        </div>
                    </button>

                    {/* Validate All Button */}
                    <button
                        onClick={handleValidateAll}
                        disabled={validating || loading}
                        className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2.5 overflow-hidden"
                    >
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                        {/* Content */}
                        <div className="relative flex items-center gap-2.5">
                            {validating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>กำลังตรวจสอบ...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                    <span>Auto Validate All</span>
                                    <Sparkles className="h-4 w-4 group-hover:scale-125 transition-transform" />
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                        </div>
                        <button
                            onClick={() => fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter)}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                )}

                {/* Main Table Section */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-card-foreground">รายการคำขอสร้างร้านค้าทั้งหมด</h2>
                                <p className="text-sm text-muted-foreground">จัดการและตรวจสอบสถานะร้านค้า</p>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาร้านค้า, ID, บูธ..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-9 pr-4 py-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Dropdowns */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={typeFilter || ''}
                                    onChange={(e) => {
                                        setTypeFilter(e.target.value as StoreType || undefined);
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors border border-border"
                                >
                                    <option value="">ประเภททั้งหมด</option>
                                    <option value="Club">องค์กรนิสิต</option>
                                    <option value="Nisit">ร้านค้านิสิต</option>
                                </select>

                                <select
                                    value={statusFilter || ''}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value as StoreState || undefined);
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors border border-border"
                                >
                                    <option value="">สถานะทั้งหมด</option>
                                    <option value="Pending">รอดำเนินการ</option>
                                    <option value="Validated">อนุมัติแล้ว</option>
                                    <option value="Rejected">ปฏิเสธ</option>
                                </select>

                                <select
                                    value={sortFilter}
                                    onChange={(e) => {
                                        setSortFilter(e.target.value as 'id' | 'name');
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors border border-border"
                                >
                                    <option value="id">เรียงตาม ID</option>
                                    <option value="name">เรียงตามชื่อ</option>
                                </select>
                            </div>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Refresh Button */}
                            <button
                                onClick={() => fetchStores(currentPage, statusFilter, typeFilter, searchQuery, sortFilter)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                            >
                                <RotateCcw size={16} />
                                <span className="hidden sm:inline">รีเฟรช</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</span>
                            </div>
                        ) : stores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">ไม่พบข้อมูลร้านค้า</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                                    <tr>
                                        <th className="p-4 pl-6">ID</th>
                                        <th className="p-4">Booth</th>
                                        <th className="p-4">ชื่อร้านค้า</th>
                                        <th className="p-4 text-center">ทีมงาน</th>
                                        <th className="p-4 text-center">สินค้า</th>
                                        <th className="p-4 text-center">ประเภท</th>
                                        <th className="p-4 text-center">ประเภทสินค้า</th>
                                        <th className="p-4 text-center">แผนผังบูธ</th>
                                        <th className="p-4 text-center">ฟอร์มสมัคร</th>
                                        <th className="p-4 text-center">คำถาม</th>
                                        <th className="p-4 text-center">สถานะ</th>
                                        <th className="p-4 pr-6 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stores.map((store) => {
                                        const statusDisplay = getStatusDisplay(store.state);
                                        const storeAdmin = store.storeAdmin;
                                        // Filter out members who have the same nisitId as the admin
                                        const uniqueMembers = storeAdmin
                                            ? store.members.filter(member => member.nisitId !== storeAdmin.nisitId)
                                            : store.members;
                                        // Count: 1 (admin) + unique members + pending members
                                        const totalMembers = (storeAdmin ? 1 : 0) + uniqueMembers.length + store.memberAttemptEmails.length;
                                        const isUpdating = updatingStoreId === store.id;

                                        return (
                                            <React.Fragment key={store.id}>
                                                <tr className={`group transition-colors hover:bg-muted/30 ${expandedRow === store.id ? 'bg-muted/30' : ''}`}>
                                                    <td className="p-4 pl-6">
                                                        <span className="font-mono text-xs text-muted-foreground">#{store.id}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-medium text-sm">{store.boothNumber || '-'}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                                {store.storeName.substring(0, 1).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-foreground">{store.storeName}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Admin: {storeAdmin ? `${storeAdmin.firstName} ${storeAdmin.lastName}` : 'ไม่ระบุ'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => toggleMembers(store.id)}
                                                            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                                                                ${expandedRow === store.id
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                        >
                                                            <Users size={14} />
                                                            {totalMembers}
                                                            {expandedRow === store.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        </button>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => toggleGoods(store.id)}
                                                            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                                                                ${expandedGoodsRow === store.id
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                        >
                                                            <Package size={14} />
                                                            {store.goods.length}
                                                            {expandedGoodsRow === store.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        </button>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <span className="text-xs text-muted-foreground">
                                                            {store.type === 'Club' ? 'องค์กรนิสิต' : 'ร้านค้านิสิต'}
                                                        </span>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        {store.goodType ? (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${store.goodType === 'Food'
                                                                ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                                }`}>
                                                                {store.goodType === 'Food' ? 'อาหาร' : 'สินค้าอื่นๆ'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">-</span>
                                                        )}
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => handleViewMedia(store.boothMediaId, 'แผนผังบูธ')}
                                                            disabled={!store.boothMediaId}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={store.boothMediaId ? "ดูแผนผังบูธ" : "ไม่มีแผนผังบูธ"}
                                                        >
                                                            <Map size={18} />
                                                        </button>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => handleViewMedia(store.clubInfo?.clubApplicationMedia?.id || null, 'ฟอร์มสมัครร้านค้า')}
                                                            disabled={!store.clubInfo?.clubApplicationMedia?.id}
                                                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={store.clubInfo?.clubApplicationMedia?.id ? "ดูฟอร์มสมัครร้านค้า" : "ไม่มีฟอร์มสมัคร"}
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => toggleQuestions(store.id)}
                                                            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                                                                ${expandedQuestionsRow === store.id
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                        >
                                                            <MessageSquare size={14} />
                                                            {store.questionAnswers.length}
                                                            {expandedQuestionsRow === store.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        </button>
                                                    </td>

                                                    {/* Combined Status Column - Store State (top) and Review Status (bottom) */}
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            {/* Store Status Badge - Top */}
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusDisplay.className}`}>
                                                                {statusDisplay.label}
                                                            </span>

                                                            {/* Divider */}
                                                            <div className="w-full h-px bg-border/100" />

                                                            {/* Review Status Badge - Bottom */}
                                                            {store.reviewDrafts.length > 0 ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    {(() => {
                                                                        const latestReview = store.reviewDrafts[0];
                                                                        const reviewDisplay = getReviewStatusDisplay(latestReview.status);
                                                                        return (
                                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${reviewDisplay.className}`}>
                                                                                {reviewDisplay.label}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {store.reviewDrafts.length} review{store.reviewDrafts.length > 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    ยังไม่มีการ review
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions Column */}
                                                    <td className="p-4 pr-6">
                                                        <div className="flex flex-col items-center gap-2">
                                                            {/* Manual Validation Buttons - Top Row */}
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {store.state === 'Validated' || store.state === 'Rejected' ? (
                                                                    /* Undo Button - Revert to Pending */
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(store.id, 'Pending')}
                                                                        className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                                                                        title="ย้อนผลตัดสิน (กลับเป็น Pending)"
                                                                        disabled={updatingStatusId !== null}
                                                                    >
                                                                        <RotateCcw size={16} />
                                                                    </button>
                                                                ) : (
                                                                    <>
                                                                        {/* Manual Validate Button */}
                                                                        <button
                                                                            onClick={() => handleUpdateStatus(store.id, 'Validated')}
                                                                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                                                                            title="ตั้งเป็น Validated"
                                                                            disabled={updatingStatusId !== null}
                                                                        >
                                                                            <CheckCircle size={16} />
                                                                        </button>

                                                                        {/* Manual Reject Button */}
                                                                        <button
                                                                            onClick={() => handleUpdateStatus(store.id, 'Rejected')}
                                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                            title="ตั้งเป็น Rejected"
                                                                            disabled={updatingStatusId !== null}
                                                                        >
                                                                            <XCircle size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Divider */}
                                                            <div className="w-full h-px bg-border/100" />

                                                            {/* Auto Validate & Review Actions - Bottom Row */}
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {/* Auto Validate Button - Always show */}
                                                                {validatingStoreId === store.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleValidateSingle(store.id)}
                                                                        className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                                                                        title="Auto Validate ร้านนี้"
                                                                        disabled={validatingStoreId !== null}
                                                                    >
                                                                        <Zap size={16} />
                                                                    </button>
                                                                )}

                                                                {/* Review action buttons - Always show if has reviews */}
                                                                {store.reviewDrafts.length > 0 && (
                                                                    <>
                                                                        {/* View Review Details Button */}
                                                                        <button
                                                                            onClick={() => toggleReviewDetails(store.id)}
                                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                                            title="ดูรายละเอียด Review"
                                                                        >
                                                                            <MessageSquareText size={16} />
                                                                        </button>

                                                                        {/* Merge Single Button */}
                                                                        {mergingStoreId === store.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleMergeSingle(store.id)}
                                                                                className="p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-md transition-colors"
                                                                                title="Merge Review Status"
                                                                                disabled={mergingStoreId !== null}
                                                                            >
                                                                                <GitMerge size={16} />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {
                                                    expandedQuestionsRow === store.id && (
                                                        <tr>
                                                            <td colSpan={12} className="p-0 border-b border-border bg-muted/20">
                                                                <div className="p-6 pl-12">
                                                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                        <MessageSquare size={16} />
                                                                        คำถามและคำตอบ ({store.questionAnswers.length} คำถาม)
                                                                    </h4>
                                                                    {store.questionAnswers.length === 0 ? (
                                                                        <p className="text-sm text-muted-foreground">ไม่มีคำตอบ</p>
                                                                    ) : (
                                                                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                                                            {store.questionAnswers.map((qa, idx) => (
                                                                                <div key={qa.id} className="p-4 rounded-lg border border-border bg-background shadow-sm">
                                                                                    <div className="flex items-start gap-3">
                                                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                                                                            {idx + 1}
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <div className="text-sm font-medium text-foreground mb-2">
                                                                                                {qa.question.label}
                                                                                            </div>
                                                                                            <div className="text-xs text-muted-foreground mb-2">
                                                                                                ประเภท: {qa.question.type === 'TEXT' ? 'ข้อความ' : 'เลือกหลายตัวเลือก'}
                                                                                            </div>
                                                                                            {qa.question.type === 'TEXT' ? (
                                                                                                <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                                                                                    <div className="text-sm text-foreground whitespace-pre-wrap">
                                                                                                        {qa.value.text || '-'}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : qa.question.type === 'MULTI_SELECT' && qa.value.values ? (
                                                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                                                    {qa.value.values.map((val, valIdx) => (
                                                                                                        <span
                                                                                                            key={valIdx}
                                                                                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                                                                                        >
                                                                                                            {val}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="mt-2 text-sm text-muted-foreground italic">
                                                                                                    ไม่มีคำตอบ
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }

                                                {
                                                    expandedGoodsRow === store.id && (
                                                        <tr>
                                                            <td colSpan={12} className="p-0 border-b border-border bg-muted/20">
                                                                <div className="p-6 pl-12">
                                                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                        <Package size={16} />
                                                                        รายการสินค้า ({store.goods.length} รายการ)
                                                                    </h4>
                                                                    {store.goods.length === 0 ? (
                                                                        <p className="text-sm text-muted-foreground">ไม่มีสินค้า</p>
                                                                    ) : (
                                                                        <div className="max-h-96 overflow-y-auto pr-2">
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                                                {store.goods.map((good, idx) => (
                                                                                    <div key={idx} className="flex flex-col p-3 rounded-lg border border-border bg-background shadow-sm">
                                                                                        {good.googleMedia ? (
                                                                                            <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-muted">
                                                                                                {goodImageUrls[good.id] ? (
                                                                                                    <img
                                                                                                        src={goodImageUrls[good.id]}
                                                                                                        alt={good.name}
                                                                                                        className="w-full h-full object-cover"
                                                                                                    />
                                                                                                ) : (
                                                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                                                                                <Utensils className="h-12 w-12 text-gray-300" />
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex-1">
                                                                                            <div className="text-sm font-medium text-foreground mb-1">{good.name}</div>
                                                                                            <div className="flex items-center justify-between">
                                                                                                <span className="text-xs text-muted-foreground">
                                                                                                    {good.type === 'Food' ? 'อาหาร' : 'สินค้าอื่นๆ'}
                                                                                                </span>
                                                                                                <span className="text-sm font-semibold text-primary">
                                                                                                    ฿{parseFloat(good.price).toFixed(2)}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }

                                                {
                                                    expandedRow === store.id && (
                                                        <tr>
                                                            <td colSpan={12} className="p-0 border-b border-border bg-muted/20">
                                                                <div className="p-6 pl-12">
                                                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                        <Users size={16} />
                                                                        รายชื่อสมาชิกในทีม ({totalMembers} คน)
                                                                    </h4>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                                        {/* Store Admin */}
                                                                        {storeAdmin ? (
                                                                            <div className="flex flex-col p-3 rounded-lg border border-border bg-background shadow-sm">
                                                                                <div className="flex items-center gap-3 mb-0">
                                                                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                                                                        {storeAdmin.firstName?.substring(0, 1) || '?'}{storeAdmin.lastName?.substring(0, 1) || '?'}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm font-medium text-foreground">
                                                                                                {storeAdmin.firstName} {storeAdmin.lastName}
                                                                                            </span>
                                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                                                Admin
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="pl-11 space-y-0.5">
                                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                        <span className="font-medium">ID:</span> {storeAdmin.nisitId}
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                        <span className="font-medium">Email:</span> {storeAdmin.email}
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                        <span className="font-medium">Tel:</span> {storeAdmin.phone}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col p-3 rounded-lg border border-border bg-background shadow-sm text-muted-foreground text-sm items-center justify-center">
                                                                                ไม่มีข้อมูล Admin
                                                                            </div>
                                                                        )}

                                                                        {/* Members - filtered to exclude duplicates */}
                                                                        {uniqueMembers.map((member, idx) => (
                                                                            <div key={idx} className="flex flex-col p-3 rounded-lg border border-border bg-background shadow-sm">
                                                                                <div className="flex items-center gap-3 mb-0">
                                                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                                                        {member.firstName.substring(0, 1)}{member.lastName.substring(0, 1)}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm font-medium text-foreground">
                                                                                                {member.firstName} {member.lastName}
                                                                                            </span>
                                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                                                สมาชิก
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="pl-11 space-y-0.5">
                                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                        <span className="font-medium">ID:</span> {member.nisitId}
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                        <span className="font-medium">Email:</span> {member.email}
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                        <span className="font-medium">Tel:</span> {member.phone}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}

                                                                        {/* Pending Members */}
                                                                        {store.memberAttemptEmails.map((attempt, idx) => (
                                                                            <div key={`attempt-${idx}`} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-background/50 shadow-sm">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-xs font-medium text-yellow-700 dark:text-yellow-400">
                                                                                        ?
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-sm font-medium text-foreground">{attempt.email}</div>
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            {attempt.status === 'NotFound' ? 'ไม่พบผู้ใช้' :
                                                                                                attempt.status === 'Pending' ? 'รอการยืนยัน' : 'เข้าร่วมแล้ว'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Club Info */}
                                                                    {store.clubInfo && (
                                                                        <div className="mt-4 p-4 rounded-lg border border-border bg-background">
                                                                            <h5 className="text-sm font-semibold text-foreground mb-2">ข้อมูลชุมนุม</h5>
                                                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                                                <div>
                                                                                    <span className="text-muted-foreground">ชื่อชุมนุม:</span>
                                                                                    <span className="ml-2 text-foreground">{store.clubInfo.clubName}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-muted-foreground">ประธานชุมนุม:</span>
                                                                                    <span className="ml-2 text-foreground">{store.clubInfo.leaderNisitId} {store.clubInfo.leaderFirstName} {store.clubInfo.leaderLastName}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }

                                                {
                                                    expandedReviewRow === store.id && store.reviewDrafts.length > 0 && (
                                                        <tr>
                                                            <td colSpan={12} className="p-0 border-b border-border bg-muted/20">
                                                                <div className="p-6 pl-12">
                                                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                        <ListChecks size={16} />
                                                                        Review History ({store.reviewDrafts.length} รายการ)
                                                                    </h4>
                                                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                                                        {store.reviewDrafts.map((review, idx) => {
                                                                            const reviewDisplay = getReviewStatusDisplay(review.status);
                                                                            return (
                                                                                <div key={idx} className="p-4 rounded-lg border border-border bg-background shadow-sm">
                                                                                    <div className="flex items-start justify-between mb-3">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                                                                #{idx + 1}
                                                                                            </div>
                                                                                            <div>
                                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${reviewDisplay.className}`}>
                                                                                                        {reviewDisplay.label}
                                                                                                    </span>
                                                                                                    {review.createdAt && (
                                                                                                        <span className="text-xs text-muted-foreground">
                                                                                                            {new Date(review.createdAt).toLocaleString('th-TH')}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                {review.admin && (
                                                                                                    <div className="text-xs text-muted-foreground">
                                                                                                        ตรวจสอบโดย: {review.admin.name} ({review.admin.email})
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {review.comment && (
                                                                                        <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                                                                            <div className="text-xs font-medium text-muted-foreground mb-1">ความคิดเห็น:</div>
                                                                                            <div className="text-sm text-foreground whitespace-pre-wrap">{review.comment}</div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && stores.length > 0 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                แสดง {((currentPage - 1) * pagination.limit) + 1} - {Math.min(currentPage * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm text-foreground px-3">
                                    หน้า {currentPage} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === pagination.totalPages}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
}