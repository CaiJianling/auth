import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
    title,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    title?: string;
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                {breadcrumbs.length > 0 ? (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                ) : title ? (
                    <h1 className="text-sm font-normal">{title}</h1>
                ) : null}
            </div>
        </header>
    );
}
