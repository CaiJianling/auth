import { Head } from '@inertiajs/react';
import AuthorizationCodeManagement from '@/components/authorization-code';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: '授权码管理',
        href: '/authorization-code',
    },
];

interface PageProps {
    codes: any[];
    code?: string;
    software?: string;
    authorizations?: any[];
}

export default function Index({ codes, code, software, authorizations }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="授权码管理" />
            <AuthorizationCodeManagement codes={codes} code={code} software={software} authorizations={authorizations} />
        </AppLayout>
    );
}
