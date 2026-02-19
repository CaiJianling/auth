import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Head } from '@inertiajs/react';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    title,
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            {title && <Head title={title} />}
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} title={title} />
                {children}
            </AppContent>
        </AppShell>
    );
}
