import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Software from '@/components/software';

interface SoftwareProps {
    softwares: Array<{
        id: number;
        name: string;
        latest_version: string;
        download_url: string | null;
        is_active: boolean;
        notes: string | null;
        created_at: string;
        updated_at: string;
    }>;
}

export default function SoftwareIndex() {
    const page = usePage<SoftwareProps>();
    const { softwares } = page.props;

    return (
        <AppLayout
            title="我的软件"
        >
            <Software softwares={softwares} />
        </AppLayout>
    );
}
