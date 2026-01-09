"use client";

import { useEffect, useState } from "react";
import SidebarSkeleton from "./SidebarSkeleton";
import SidebarItem from "./SidebarItem";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

type Playlist = {
    id: string;
    youtube_playlist_id: string;
    title: string | null;
};

export default function Sidebar({ open }: { open: boolean }) {
    const pathname = usePathname();
    const { user, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [query, setQuery] = useState("");

    const filteredPlaylists = playlists.filter((pl) =>
        (pl.title ?? pl.youtube_playlist_id)
            .toLowerCase()
            .includes(query.toLowerCase())
    );

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setPlaylists([]);
            setLoading(false);
            return;
        }

        let mounted = true;

        async function load() {
            setLoading(true);
            const res = await fetch("/api/playlists");
            const data = await res.json();

            if (!mounted) return;

            setPlaylists(data);
            setLoading(false);
        }

        load();

        return () => {
            mounted = false;
        };
    }, [user, authLoading]);

    // Guest → no sidebar
    if (!user) return null;

    return (
        <aside
            className={`fixed left-0 z-40 h-screen
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
