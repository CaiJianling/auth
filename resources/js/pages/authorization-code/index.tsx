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
    code_values: string[];
}

export default function Index({ codes, code_values }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="授权码管理" />
            <AuthorizationCodeManagement codes={codes} code_values={code_values} />
        </AppLayout>
    );
}
