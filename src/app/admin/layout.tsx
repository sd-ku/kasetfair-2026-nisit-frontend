'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
