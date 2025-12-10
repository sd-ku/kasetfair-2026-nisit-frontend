'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    Users,
    GraduationCap,
    LogOut,
} from 'lucide-react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
}

function NavItem({ icon, label, href, active = false }: NavItemProps) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group
             ${active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
        >
            <span className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}>
                {icon}
            </span>
            <span>{label}</span>
        </Link>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();

    const navItems = [
        {
            icon: <LayoutDashboard size={18} />,
            label: 'Dashboard',
            href: '/admin/dashboard',
        },
        // {
        //     icon: <Store size={18} />,
        //     label: 'ร้านค้าทั้งหมด',
        //     href: '/admin/stores',
        // },
        // {
        //     icon: <Users size={18} />,
        //     label: 'จัดการนิสิต',
        //     href: '/admin/nisits',
        // },
        {
            icon: <GraduationCap size={18} />,
            label: 'ผู้เข้าร่วมอบรม',
            href: '/admin/nisit-training-participant',
        },
    ];

    return (
        <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex">
            <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <LayoutDashboard className="text-primary-foreground h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-sidebar-foreground">Admin Panel</span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 mt-4">
                    Overview
                </div>
                {navItems.map((item) => (
                    <NavItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={pathname === item.href}
                    />
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <button className="flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full p-3 rounded-md transition-all group">
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">ออกจากระบบ</span>
                </button>
                <div className="mt-4 flex items-center gap-3 px-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                        AD
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Admin User</span>
                        <span className="text-xs text-muted-foreground">admin@kasetfair.com</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
