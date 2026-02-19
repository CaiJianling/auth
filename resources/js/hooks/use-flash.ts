import { usePage } from '@inertiajs/react';

export function useFlash() {
    const { props } = usePage();
    return {
        success: (props.flash as any)?.success,
        error: (props.flash as any)?.error,
    };
}
