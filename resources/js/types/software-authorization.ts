export interface SoftwareAuthorization {
    id: number;
    software_name: string;
    software_version: string;
    os_version: string;
    bios_uuid: string;
    motherboard_serial: string;
    cpu_id: string;
    request_ip: string;
    last_access_ip: string | null;
    status: 'pending' | 'approved' | 'rejected';
    authorized_at: string | null;
    notes: string | null;
    authorization_code_id: number | null;
    authorization_code?: {
        id: number;
        name: string;
        code: string;
        notes: string | null;
        start_time: string | null;
        end_time: string | null;
    };
    created_at: string;
    updated_at: string;
    access_logs?: AccessLog[];
}

export type AuthorizationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface AccessLog {
    id: number;
    software_authorization_id: number;
    access_type: 'update' | 'check' | 'code_change';
    changes: {
        before: {
            bios_uuid?: string;
            motherboard_serial?: string;
            cpu_id?: string;
            code?: string;
            notes?: string | null;
            start_time?: string | null;
            end_time?: string | null;
        };
        after: {
            bios_uuid?: string;
            motherboard_serial?: string;
            cpu_id?: string;
            code?: string;
            notes?: string | null;
            start_time?: string | null;
            end_time?: string | null;
        };
    } | null;
    ip_address: string;
    is_expired: boolean;
    created_at: string;
    updated_at: string;
}
