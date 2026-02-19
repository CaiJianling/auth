export interface AuthorizationCode {
    id: number;
    code: string;
    notes: string | null;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
    used_count: number;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
}
