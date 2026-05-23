"use client";

import { useEffect, useState } from "react";

export function useAdminAccess() {
    const [canAccess, setCanAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const response = await fetch("/api/admin/me");
                const data = (await response.json()) as { canAccess?: boolean };

                if (!mounted) return;

                setCanAccess(Boolean(data.canAccess));
            } catch {
                if (!mounted) return;

                setCanAccess(false);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            mounted = false;
        };
    }, []);

    return { canAccess, loading };
}
