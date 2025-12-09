'use client';

import React, { useState } from 'react';
import {
    Users,
    Map,
    FileText,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    LayoutDashboard,
    Store,
    Settings,
    LogOut,
    RotateCcw,
    Search,
    Bell,
    MoreVertical
} from 'lucide-react';

// --- Type Definitions ---
interface Member {
    name: string;
    role: string;
}

interface StoreData {
    id: string;
    boothNo: string;
    storeName: string;
    members: Member[];
    mapLink: string;
    formLink: string;
    status: 'pending' | 'accepted' | 'rejected';
}

// --- Mock Data ---
const initialData: StoreData[] = [
    {
        id: 'S001',
        boothNo: 'A-12',
        storeName: 'ร้านกาแฟแมวเหมียว',
        members: [
            { name: 'สมชาย ใจดี', role: 'เจ้าของร้าน' },
            { name: 'สมหญิง รักแมว', role: 'พนักงาน' }
        ],
        mapLink: '#',
        formLink: '#',
        status: 'pending',
    },
    {
        id: 'S002',
        boothNo: 'B-05',
        storeName: 'Bakery House',
        members: [
            { name: 'John Doe', role: 'Manager' }
        ],
        mapLink: '#',
        formLink: '#',
        status: 'accepted',
    },
    {
        id: 'S003',
        boothNo: 'A-14',
        storeName: 'Thai Street Food',
        members: [
            { name: 'สุดา พาเพลิน', role: 'แม่ครัว' },
            { name: 'มานะ อดทน', role: 'ผู้ช่วย' },
            { name: 'มานี มีตา', role: 'แคชเชียร์' }
        ],
        mapLink: '#',
        formLink: '#',
        status: 'pending',
    },
    {
        id: 'S004',
        boothNo: 'C-01',
        storeName: 'Kaset Organic',
        members: [
            { name: 'Somsak K.', role: 'Admin' }
        ],
        mapLink: '#',
        formLink: '#',
        status: 'rejected',
    },
];

export default function AdminDashboardPage() {
    const [stores, setStores] = useState<StoreData[]>(initialData);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleMembers = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handleStatusChange = (id: string, newStatus: 'accepted' | 'rejected' | 'pending') => {
        setStores(stores.map(store =>
            store.id === id ? { ...store, status: newStatus } : store
        ));
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">

            {/* Sidebar */}
            <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex">
                <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="text-primary-foreground h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-sidebar-foreground">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-4">Overview</div>
                    <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
                    <NavItem icon={<Store size={18} />} label="ร้านค้าทั้งหมด" />
                    <NavItem icon={<Users size={18} />} label="จัดการสมาชิก" />

                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-8">System</div>
                    <NavItem icon={<Settings size={18} />} label="ตั้งค่าระบบ" />
                </nav>

                <div className="p-4 border-t border-sidebar-border">
                    <button className="flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 w-full p-3 rounded-md transition-all group">
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">ออกจากระบบ</span>
                    </button>
                    <div className="mt-4 flex items-center gap-3 px-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">Admin</div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Admin User</span>
                            <span className="text-xs text-muted-foreground">admin@kasetfair.com</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">

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
                            value="120"
                            change="+12% from last month"
                            icon={<FileText className="h-5 w-5 text-blue-600" />}
                            bgIcon="bg-blue-100"
                        />
                        <StatCard
                            title="อนุมัติแล้ว"
                            value="85"
                            change="+4% from last month"
                            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                            bgIcon="bg-green-100"
                        />
                        <StatCard
                            title="รอดำเนินการ"
                            value="30"
                            change="-2% from last month"
                            icon={<RotateCcw className="h-5 w-5 text-orange-600" />}
                            bgIcon="bg-orange-100"
                        />
                        <StatCard
                            title="ปฏิเสธ"
                            value="5"
                            change="+1% from last month"
                            icon={<XCircle className="h-5 w-5 text-red-600" />}
                            bgIcon="bg-red-100"
                        />
                    </div>

                    {/* Main Table Section */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-card-foreground">รายการคำขอเข้าร่วมร้านค้า</h2>
                                <p className="text-sm text-muted-foreground">จัดการและตรวจสอบสถานะร้านค้า</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors">
                                    Filter
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors">
                                    Export
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                                    <tr>
                                        <th className="p-4 pl-6">ID & Booth</th>
                                        <th className="p-4">ชื่อร้านค้า</th>
                                        <th className="p-4 text-center">ทีมงาน</th>
                                        <th className="p-4 text-center">เอกสาร</th>
                                        <th className="p-4 text-center">สถานะ</th>
                                        <th className="p-4 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stores.map((store) => (
                                        <React.Fragment key={store.id}>
                                            <tr className={`group transition-colors hover:bg-muted/30 ${expandedRow === store.id ? 'bg-muted/30' : ''}`}>
                                                <td className="p-4 pl-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-xs text-muted-foreground">{store.id}</span>
                                                        <span className="font-medium text-sm">{store.boothNo}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            {store.storeName.substring(0, 1)}
                                                        </div>
                                                        <span className="font-medium text-foreground">{store.storeName}</span>
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
                                                        {store.members.length}
                                                        {expandedRow === store.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                    </button>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a href={store.mapLink} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="ดูแผนผังร้าน">
                                                            <Map size={18} />
                                                        </a>
                                                        <a href={store.formLink} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="ดูใบสมัคร">
                                                            <FileText size={18} />
                                                        </a>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                        ${store.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                            store.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                                                                'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'}`}>
                                                        {store.status === 'accepted' ? 'อนุมัติแล้ว' : store.status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอดำเนินการ'}
                                                    </span>
                                                </td>

                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {store.status === 'pending' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleStatusChange(store.id, 'accepted')}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                                    title="อนุมัติ"
                                                                >
                                                                    <CheckCircle size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusChange(store.id, 'rejected')}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                    title="ปฏิเสธ"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleStatusChange(store.id, 'pending')}
                                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-colors"
                                                                title="แก้ไขสถานะ"
                                                            >
                                                                <RotateCcw size={18} />
                                                            </button>
                                                        )}
                                                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {expandedRow === store.id && (
                                                <tr>
                                                    <td colSpan={6} className="p-0 border-b border-border bg-muted/20">
                                                        <div className="p-6 pl-12">
                                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                                <Users size={16} />
                                                                รายชื่อสมาชิกในทีม
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                                {store.members.map((member, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background shadow-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                                                {member.name.substring(0, 2)}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-medium text-foreground">{member.name}</div>
                                                                                <div className="text-xs text-muted-foreground">{member.role}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- Helper Components ---
function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <a href="#" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group
             ${active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
            <span className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}>
                {icon}
            </span>
            <span>{label}</span>
        </a>
    );
}

function StatCard({ title, value, change, icon, bgIcon }: { title: string, value: string, change: string; icon: React.ReactNode; bgIcon: string }) {
    return (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${bgIcon}`}>
                    {icon}
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
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