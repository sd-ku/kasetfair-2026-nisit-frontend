'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Map,
    FileText,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Search,
    Bell,
    MoreVertical,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { findAllStores, updateStoreStatus } from '@/services/admin/reviewStoreService';
import { AdminStoreDto, PaginationMetaDto } from '@/services/admin/dto/review-store.dto';
import { StoreState } from '@/services/dto/store-info.dto';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
    const [stores, setStores] = useState<AdminStoreDto[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationMetaDto>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<StoreState | undefined>(undefined);
    const [updatingStoreId, setUpdatingStoreId] = useState<number | null>(null);

    // Fetch stores from API
    const fetchStores = async (page: number = 1, status?: StoreState) => {
        try {
            setLoading(true);
            setError(null);
            const response = await findAllStores({
                page,
                limit: 10,
                status
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

    // Initial load
    useEffect(() => {
        fetchStores(currentPage, statusFilter);
    }, [currentPage, statusFilter]);

    const toggleMembers = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
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
            await fetchStores(currentPage, statusFilter);
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

    // Calculate stats from current data
    const stats = {
        total: pagination.total,
        validated: stores.filter(s => s.state === 'Validated').length,
        pending: stores.filter(s => s.state === 'Pending').length,
        rejected: stores.filter(s => s.state === 'Rejected').length,
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
            'Rejected': { label: 'ถูกปฏิเสธ', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' }
        };
        return statusMap[state] || { label: state, className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' };
    };

    return (
        <>
            {/* Header */}
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 z-10">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            className="h-9 w-64 rounded-md border border-input bg-transparent px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                    <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="คำขอทั้งหมด"
                        value={stats.total.toString()}
                        change={`${pagination.totalPages} หน้า`}
                        icon={<FileText className="h-5 w-5 text-blue-600" />}
                        bgIcon="bg-blue-100"
                    />
                    <StatCard
                        title="อนุมัติแล้ว"
                        value={stats.validated.toString()}
                        change={`${((stats.validated / stats.total) * 100 || 0).toFixed(0)}%`}
                        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                        bgIcon="bg-green-100"
                    />
                    <StatCard
                        title="รอดำเนินการ"
                        value={stats.pending.toString()}
                        change={`${((stats.pending / stats.total) * 100 || 0).toFixed(0)}%`}
                        icon={<RotateCcw className="h-5 w-5 text-orange-600" />}
                        bgIcon="bg-orange-100"
                    />
                    <StatCard
                        title="ปฏิเสธ"
                        value={stats.rejected.toString()}
                        change={`${((stats.rejected / stats.total) * 100 || 0).toFixed(0)}%`}
                        icon={<XCircle className="h-5 w-5 text-red-600" />}
                        bgIcon="bg-red-100"
                    />
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                        </div>
                        <button
                            onClick={() => fetchStores(currentPage, statusFilter)}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors"
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                )}

                {/* Main Table Section */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-card-foreground">รายการคำขอเข้าร่วมร้านค้า</h2>
                            <p className="text-sm text-muted-foreground">จัดการและตรวจสอบสถานะร้านค้า</p>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter || ''}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as StoreState || undefined);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors border border-border"
                            >
                                <option value="">ทั้งหมด</option>
                                <option value="Pending">รอดำเนินการ</option>
                                <option value="Approved">อนุมัติแล้ว</option>
                                <option value="Rejected">ปฏิเสธ</option>
                            </select>
                            <button
                                onClick={() => fetchStores(currentPage, statusFilter)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
                            >
                                <RotateCcw size={16} className="inline mr-1" />
                                รีเฟรช
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
                                        <th className="p-4 pl-6">ID & Booth</th>
                                        <th className="p-4">ชื่อร้านค้า</th>
                                        <th className="p-4 text-center">ทีมงาน</th>
                                        <th className="p-4 text-center">ประเภท</th>
                                        <th className="p-4 text-center">สถานะ</th>
                                        <th className="p-4 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stores.map((store) => {
                                        const statusDisplay = getStatusDisplay(store.state);
                                        const totalMembers = store.members.length + store.memberAttemptEmails.length;
                                        const isUpdating = updatingStoreId === store.id;

                                        return (
                                            <React.Fragment key={store.id}>
                                                <tr className={`group transition-colors hover:bg-muted/30 ${expandedRow === store.id ? 'bg-muted/30' : ''}`}>
                                                    <td className="p-4 pl-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-xs text-muted-foreground">#{store.id}</span>
                                                            <span className="font-medium text-sm">{store.boothNumber || 'ไม่มีบูธ'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                                {store.storeName.substring(0, 1).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-foreground">{store.storeName}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Admin: {store.storeAdmin.firstName} {store.storeAdmin.lastName}
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
                                                        <span className="text-xs text-muted-foreground">
                                                            {store.type === 'Club' ? 'ชุมนุม' : 'ทั่วไป'}
                                                        </span>
                                                    </td>

                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusDisplay.className}`}>
                                                            {statusDisplay.label}
                                                        </span>
                                                    </td>

                                                    <td className="p-4 pr-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {isUpdating ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                            ) : (
                                                                <>
                                                                    {store.state === 'Pending' ? (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleStatusChange(store.id, 'Validated')}
                                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                                                title="อนุมัติ"
                                                                                disabled={isUpdating}
                                                                            >
                                                                                <CheckCircle size={18} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleStatusChange(store.id, 'Rejected')}
                                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                                title="ปฏิเสธ"
                                                                                disabled={isUpdating}
                                                                            >
                                                                                <XCircle size={18} />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleStatusChange(store.id, 'Pending')}
                                                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                                                                            title="เปลี่ยนเป็นรอดำเนินการ"
                                                                            disabled={isUpdating}
                                                                        >
                                                                            <RotateCcw size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors">
                                                                        <MoreVertical size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {expandedRow === store.id && (
                                                    <tr>
                                                        <td colSpan={6} className="p-0 border-b border-border bg-muted/20">
                                                            <div className="p-6 pl-12">
                                                                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                    <Users size={16} />
                                                                    รายชื่อสมาชิกในทีม ({totalMembers} คน)
                                                                </h4>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                                    {/* Store Admin */}
                                                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background shadow-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                                                                {store.storeAdmin.firstName.substring(0, 1)}{store.storeAdmin.lastName.substring(0, 1)}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-medium text-foreground">
                                                                                    {store.storeAdmin.firstName} {store.storeAdmin.lastName}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">Admin • {store.storeAdmin.nisitId}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Members */}
                                                                    {store.members.map((member, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background shadow-sm">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                                                    {member.firstName.substring(0, 1)}{member.lastName.substring(0, 1)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-foreground">
                                                                                        {member.firstName} {member.lastName}
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground">สมาชิก • {member.nisitId}</div>
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
                                                                                <span className="text-muted-foreground">อาจารย์ที่ปรึกษา:</span>
                                                                                <span className="ml-2 text-foreground">{store.clubInfo.clubAdvisorName}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
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
            </div>
        </>
    );
}

// --- Helper Components ---
function StatCard({ title, value, change, icon, bgIcon }: { title: string, value: string, change: string; icon: React.ReactNode; bgIcon: string }) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${bgIcon}`}>
                    {icon}
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {change}
                </span>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
            </div>
        </div>
    );
}