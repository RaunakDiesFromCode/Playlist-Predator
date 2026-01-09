"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import SidebarSkeleton from "./SidebarSkeleton";
import SidebarItem from "./SidebarItem";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

type Playlist = {
    id: string;
    youtube_playlist_id: string;
    title: string | null;
};

export default function Sidebar({ open }: { open: boolean }) {
    const pathname = usePathname();

    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    const [query, setQuery] = useState("");

    const filteredPlaylists = playlists.filter((pl) =>
        (pl.title ?? pl.youtube_playlist_id)
            .toLowerCase()
            .includes(query.toLowerCase())
    );

    useEffect(() => {
        let mounted = true;

        async function load() {
            // auth check
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }

            setIsLoggedIn(true);

            // fetch playlists
            const res = await fetch("/api/playlists");
            const dataJson = await res.json();

            if (!mounted) return;

            setPlaylists(dataJson);
            setLoading(false);
        }

        load();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            // re-fetch on login/logout
            setLoading(true);
            load();
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Guest → no sidebar
    if (!isLoggedIn) return null;

    return (
        <aside
            className={`fixed left-0 z-40 h-[calc(100vh)]
        bg-background border-r border-border
        transition-transform duration-200 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        w-64`}
        >
            <div className="p-4 font-semibold text-lg">Playlists</div>

            <div className="px-3 pb-2">
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search playlists..."
                />
            </div>

            <div className="px-2 space-y-1">
                {loading && <SidebarSkeleton />}

                {!loading && playlists.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                        No playlists yet
                    </p>
                )}

                {!loading &&
                    filteredPlaylists.map((pl) => {
                        const href = `/${pl.youtube_playlist_id}`;
                        const active = pathname === href;

                        return (
                            <SidebarItem
                                key={pl.id}
                                title={pl.title ?? pl.youtube_playlist_id}
                                href={href}
                                active={active}
                            />
                        );
                    })}
                {!loading && filteredPlaylists.length === 0 && query && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                        No matching playlists
                    </p>
                )}
            </div>
        </aside>
    );
}
