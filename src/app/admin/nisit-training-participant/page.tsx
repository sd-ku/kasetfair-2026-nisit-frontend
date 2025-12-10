'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Plus,
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    X,
    UserPlus,
    Hash
} from 'lucide-react';
import {
    findAllParticipants,
    upsertParticipant,
    removeParticipant,
    upsertBulk,
    parseBulkNisitIds,
    deleteAll,
} from '@/services/admin/nisit-training-participant';
import type { NisitTrainingParticipant } from '@/services/admin/dto/nisit-training-participant.dto';
import { toast } from '@/lib/toast';

export default function NisitTrainingParticipantPage() {
    const [participants, setParticipants] = useState<NisitTrainingParticipant[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchNisitId, setSearchNisitId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(20);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newNisitId, setNewNisitId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
    const [bulkInput, setBulkInput] = useState('');

    // Fetch participants
    const fetchParticipants = async (page = 1, nisitId = '') => {
        setLoading(true);
        try {
            const response = await findAllParticipants({
                page,
                limit,
                nisitId: nisitId || undefined,
            });
            setParticipants(response.data);
            setTotal(response.meta.total);
            setTotalPages(response.meta.totalPages);
            setCurrentPage(response.meta.page);
        } catch (error) {
            toast({
                title: error instanceof Error ? error.message : 'Failed to fetch participants',
                variant: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants(currentPage, searchNisitId);
    }, [currentPage]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchParticipants(1, searchNisitId);
    };

    const handleClearSearch = () => {
        setSearchNisitId('');
        setCurrentPage(1);
        fetchParticipants(1, '');
    };

    const handleAddParticipant = async () => {
        if (!newNisitId.trim()) {
            toast({
                title: 'กรุณากรอก Nisit ID',
                variant: 'error'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await upsertParticipant({ nisitId: newNisitId.trim() });
            toast({
                title: 'เพิ่มผู้เข้าร่วมสำเร็จ',
                variant: 'success'
            });
            setIsModalOpen(false);
            setNewNisitId('');
            fetchParticipants(currentPage, searchNisitId);
        } catch (error) {
            toast({
                title: error instanceof Error ? error.message : 'Failed to add participant',
                variant: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddBulkParticipant = async () => {
        const ids = parseBulkNisitIds(bulkInput);
        if (ids.length === 0) {
            toast({
                title: 'ไม่พบรหัสนิสิตที่ถูกต้อง',
                variant: 'error'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await upsertBulk(ids);
            toast({
                title: `เพิ่มผู้เข้าร่วมสำเร็จ ${ids.length} รายการ`,
                variant: 'success'
            });
            setIsModalOpen(false);
            setBulkInput('');
            setNewNisitId('');
            setInputMode('single');
            fetchParticipants(currentPage, searchNisitId);
        } catch (error) {
            toast({
                title: error instanceof Error ? error.message : 'Failed to bulk add participants',
                variant: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveParticipant = async (nisitId: string) => {
        if (!confirm(`คุณต้องการลบผู้เข้าร่วม ${nisitId} หรือไม่?`)) {
            return;
        }

        try {
            await removeParticipant(nisitId);
            toast({
                title: 'ลบผู้เข้าร่วมสำเร็จ',
                variant: 'success'
            });
            fetchParticipants(currentPage, searchNisitId);
        } catch (error) {
            toast({
                title: error instanceof Error ? error.message : 'Failed to remove participant',
                variant: 'error'
            });
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('คุณแน่ใจว่าต้องการลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            return;
        }

        if (!confirm('ยืนยันอีกครั้ง! ข้อมูลผู้เข้าร่วมอบรมทั้งหมดจะถูกลบ')) {
            return;
        }

        setLoading(true);
        try {
            await deleteAll();
            toast({
                title: 'ลบข้อมูลทั้งหมดเรียบร้อยแล้ว',
                variant: 'success'
            });
            setCurrentPage(1);
            fetchParticipants(1, '');
        } catch (error) {
            toast({
                title: error instanceof Error ? error.message : 'Failed to delete all participants',
                variant: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Header */}
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 z-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        จัดการผู้เข้าร่วมอบรม
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDeleteAll}
                        disabled={participants.length === 0 || loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={20} />
                        ลบทั้งหมด
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
                    >
                        <Plus size={20} />
                        เพิ่มผู้เข้าร่วม
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {/* Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">ผู้เข้าร่วมทั้งหมด</p>
                            <h3 className="text-2xl font-bold text-foreground mt-1">{total}</h3>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">หน้าปัจจุบัน</p>
                            <h3 className="text-2xl font-bold text-foreground mt-1">{currentPage} / {totalPages}</h3>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">รายการต่อหน้า</p>
                            <h3 className="text-2xl font-bold text-foreground mt-1">{limit}</h3>
                        </div>
                    </div>
                </div>

                {/* Search and Actions */}
                <div className="bg-card rounded-xl border border-border shadow-sm mb-6">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาด้วย Nisit ID..."
                                    value={searchNisitId}
                                    onChange={(e) => setSearchNisitId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                                {searchNisitId && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ค้นหา
                            </button>
                            <button
                                onClick={() => fetchParticipants(currentPage, searchNisitId)}
                                disabled={loading}
                                className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                รีเฟรช
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                                <tr>
                                    <th className="p-4 pl-6">#</th>
                                    <th className="p-4">Nisit ID</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                                                <p className="text-muted-foreground">กำลังโหลด...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="h-12 w-12 text-muted-foreground" />
                                                <p className="text-muted-foreground">ไม่พบข้อมูลผู้เข้าร่วม</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    participants.map((participant, index) => (
                                        <tr
                                            key={participant.nisitId}
                                            className="group transition-colors hover:bg-muted/30"
                                        >
                                            <td className="p-4 pl-6">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {(currentPage - 1) * limit + index + 1}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {participant.nisitId.substring(0, 2)}
                                                    </div>
                                                    <span className="font-medium text-foreground">
                                                        {participant.nisitId}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <button
                                                    onClick={() => handleRemoveParticipant(participant.nisitId)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                แสดง {participants.length} รายการจาก {total} รายการทั้งหมด
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-medium px-4">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Participant Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-primary" />
                                เพิ่มผู้เข้าร่วมอบรม
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setNewNisitId('');
                                    setBulkInput('');
                                    setInputMode('single');
                                }}
                                className="p-1 hover:bg-muted rounded-md transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 border-b border-border bg-muted/30 shrink-0">
                            <div className="flex p-1 bg-muted rounded-lg border border-border">
                                <button
                                    onClick={() => setInputMode('single')}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${inputMode === 'single'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    รายคน
                                </button>
                                <button
                                    onClick={() => setInputMode('bulk')}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${inputMode === 'bulk'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    หลายคน (Bulk)
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {inputMode === 'single' ? (
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Nisit ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newNisitId}
                                        onChange={(e) => setNewNisitId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                                        placeholder="กรอก Nisit ID"
                                        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        หากมี Nisit ID นี้อยู่แล้ว ระบบจะอัปเดตข้อมูล
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            วางรายชื่อนิสิต (Copy & Paste) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={bulkInput}
                                            onChange={(e) => setBulkInput(e.target.value)}
                                            placeholder={`ตัวอย่าง:\nรหัสนิสิต\n6710302318\n6510406829\n...`}
                                            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[200px] font-mono text-sm resize-none"
                                            autoFocus
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            รองรับการก๊อปปี้จาก Excel หรือ Text file ระบบจะตัดตัวอักษรและช่องว่างออกให้อัตโนมัติ
                                        </p>
                                    </div>

                                    {bulkInput && (
                                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                            <div className="text-xs font-medium text-muted-foreground mb-2">
                                                พรีวิว ({parseBulkNisitIds(bulkInput).length} รายการ):
                                            </div>
                                            <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                                                {parseBulkNisitIds(bulkInput).slice(0, 20).map((id) => (
                                                    <span key={id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                        {id}
                                                    </span>
                                                ))}
                                                {parseBulkNisitIds(bulkInput).length > 20 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                                                        ...และอีก {parseBulkNisitIds(bulkInput).length - 20} คน
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border flex gap-3 justify-end shrink-0">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setNewNisitId('');
                                    setBulkInput('');
                                    setInputMode('single');
                                }}
                                className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={inputMode === 'single' ? handleAddParticipant : handleAddBulkParticipant}
                                disabled={isSubmitting || (inputMode === 'single' ? !newNisitId.trim() : !bulkInput.trim())}
                                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        {inputMode === 'single' ? 'เพิ่มผู้เข้าร่วม' : `เพิ่ม ${parseBulkNisitIds(bulkInput).length} รายการ`}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

