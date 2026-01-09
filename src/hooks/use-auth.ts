"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type AuthUser = {
    id: string;
    email: string;
    name?: string;
};

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;

            const u = data.session?.user;
            setUser(
                u
                    ? {
                          id: u.id,
                          email: u.email!,
                          name: u.user_metadata?.name,
                      }
                    : null
            );
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user;
            setUser(
                u
                    ? {
                          id: u.id,
                          email: u.email!,
                          name: u.user_metadata?.name,
                      }
                    : null
            );
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}
