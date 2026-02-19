import { Head } from '@inertiajs/react';
import { SoftwareAuthorization } from '@/components/software-authorization';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: '软件授权',
        href: '/software-authorization',
    },
];

export default function SoftwareAuthorizationPage({ authorizations, authorization_codes, software_names }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="软件授权" />
            <SoftwareAuthorization authorizations={authorizations} authorization_codes={authorization_codes} software_names={software_names} />
        </AppLayout>
    );
}
