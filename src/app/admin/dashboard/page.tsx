'use client';

import React, { useState, useEffect } from 'react';
import {
    Store,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Package,
    BarChart3,
    PieChart,
    Calendar,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { getStats } from '@/services/admin/reviewStoreService';
import { StatsResponseDto } from '@/services/admin/dto/stats-store.dto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<StatsResponseDto>({
        total: 0,
        validated: 0,
        pending: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsData = await getStats();
                setStats(statsData);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Calculate percentages
    const validatedPercentage = stats.total > 0 ? (stats.validated / stats.total) * 100 : 0;
    const pendingPercentage = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;
    const rejectedPercentage = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;
    const completionRate = stats.total > 0 ? ((stats.validated + stats.rejected) / stats.total) * 100 : 0;

    return (
        <>
            {/* Header */}
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-8 py-11 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                        <p className="text-xs text-muted-foreground">ภาพรวมระบบจัดการงานกาชาด</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Stores */}
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardDescription>ร้านค้าทั้งหมด</CardDescription>
                                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl font-bold">{stats.total}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-muted-foreground">Total Stores</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Validated */}
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardDescription>อนุมัติแล้ว</CardDescription>
                                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl font-bold">{stats.validated}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm">
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-medium">{validatedPercentage.toFixed(1)}%</span>
                                <span className="text-muted-foreground">of total</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending */}
                    <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardDescription>รอดำเนินการ</CardDescription>
                                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl font-bold">{stats.pending}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4 text-orange-600" />
                                <span className="text-orange-600 font-medium">{pendingPercentage.toFixed(1)}%</span>
                                <span className="text-muted-foreground">of total</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rejected */}
                    <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardDescription>ปฏิเสธ</CardDescription>
                                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl font-bold">{stats.rejected}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm">
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                                <span className="text-red-600 font-medium">{rejectedPercentage.toFixed(1)}%</span>
                                <span className="text-muted-foreground">of total</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Review Progress */}
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>ความคืบหน้าการตรวจสอบ</CardTitle>
                                    <CardDescription>สถานะการ review ร้านค้าทั้งหมด</CardDescription>
                                </div>
                                <PieChart className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Completion Rate */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">อัตราการตรวจสอบเสร็จสิ้น</span>
                                    <span className="text-2xl font-bold text-primary">{completionRate.toFixed(1)}%</span>
                                </div>
                                <Progress value={completionRate} className="h-3" />
                                <p className="text-xs text-muted-foreground">
                                    {stats.validated + stats.rejected} จาก {stats.total} ร้านค้า
                                </p>
                            </div>

                            {/* Individual Progress Bars */}
                            <div className="space-y-4">
                                {/* Validated */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-green-500" />
                                            <span>อนุมัติแล้ว</span>
                                        </div>
                                        <span className="font-medium">{stats.validated} ร้าน</span>
                                    </div>
                                    <Progress value={validatedPercentage} className="h-2 [&>div]:bg-green-500" />
                                </div>

                                {/* Pending */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-orange-500" />
                                            <span>รอดำเนินการ</span>
                                        </div>
                                        <span className="font-medium">{stats.pending} ร้าน</span>
                                    </div>
                                    <Progress value={pendingPercentage} className="h-2 [&>div]:bg-orange-500" />
                                </div>

                                {/* Rejected */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500" />
                                            <span>ปฏิเสธ</span>
                                        </div>
                                        <span className="font-medium">{stats.rejected} ร้าน</span>
                                    </div>
                                    <Progress value={rejectedPercentage} className="h-2 [&>div]:bg-red-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>การดำเนินการด่วน</CardTitle>
                                    <CardDescription>เข้าถึงฟังก์ชันหลักได้อย่างรวดเร็ว</CardDescription>
                                </div>
                                <Sparkles className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Pending Review Alert */}
                            {stats.pending > 0 && (
                                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                                                มีร้านค้ารอการตรวจสอบ
                                            </h4>
                                            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                                                มี {stats.pending} ร้านค้าที่รอการตรวจสอบและอนุมัติ
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <Link href="/admin/stores">
                                <button className="w-full p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm">จัดการร้านค้า</h4>
                                                <p className="text-xs text-muted-foreground">ดูและจัดการร้านค้าทั้งหมด</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </button>
                            </Link>

                            <Link href="/admin/nisits">
                                <button className="w-full p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm">จัดการนิสิต</h4>
                                                <p className="text-xs text-muted-foreground">ดูและจัดการข้อมูลนิสิต</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </button>
                            </Link>

                            <Link href="/admin/registration-settings">
                                <button className="w-full p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm">ตั้งค่าการลงทะเบียน</h4>
                                                <p className="text-xs text-muted-foreground">จัดการช่วงเวลาและสถานะการลงทะเบียน</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* System Status */}
                {/* <Card>
                    <CardHeader className="border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>สถานะระบบ</CardTitle>
                                <CardDescription>ภาพรวมสถานะการทำงานของระบบ</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                ระบบทำงานปกติ
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">ร้านค้าที่ลงทะเบียน</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">อัตราการอนุมัติ</p>
                                    <p className="text-2xl font-bold">{validatedPercentage.toFixed(0)}%</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">รอการตรวจสอบ</p>
                                    <p className="text-2xl font-bold">{stats.pending}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card> */}
            </div>
        </>
    );
}