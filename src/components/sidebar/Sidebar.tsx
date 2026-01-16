"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import SidebarSkeleton from "./SidebarSkeleton";
import SidebarItem from "./SidebarItem";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Footer from "../layout/Footer";

type Playlist = {
    id: string;
    youtube_playlist_id: string;
    title: string | null;
};

export default function Sidebar({
    open,
    onNavigateAction,
}: {
    open: boolean;
    onNavigateAction: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
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

    return (
        <aside
            className={`
                fixed left-0 top-0 z-40 h-screen
                w-full md:w-64
                bg-background border-r border-border
                transition-transform duration-200 ease-out
                ${open ? "translate-x-0" : "-translate-x-full"}
                flex flex-col
            `}
        >
            {/* HEADER */}
            <div className="p-4 font-semibold text-lg shrink-0">
                {user ? "Playlists" : "Welcome"}
            </div>

            {/* AUTHENTICATED VIEW */}
            {user && (
                <>
                    {/* SEARCH */}
                    <div className="px-3 pb-2 shrink-0">
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search playlists..."
                        />
                    </div>

                    {/* PLAYLIST LIST */}
                    <div className="px-2 space-y-1 overflow-y-auto flex-1 overscroll-contain">
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
                                        title={
                                            pl.title ?? pl.youtube_playlist_id
                                        }
                                        href={href}
                                        active={active}
                                        onClickAction={onNavigateAction}
                                    />
                                );
                            })}

                        {!loading &&
                            filteredPlaylists.length === 0 &&
                            query && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    No matching playlists
                                </p>
                            )}
                    </div>
                </>
            )}

            {/* GUEST VIEW */}
            {!user && !authLoading && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        Log in to save playlists, track progress, and sync
                        across devices.
                    </p>

                    <Button
                        onClick={() => {
                            onNavigateAction();
                            router.push("/login");
                        }}
                    >
                        Login to get started
                    </Button>
                </div>
            )}

            {/* FOOTER */}
            <div className="border-t border-border py-4 shrink-0 rounded-t-2xl">
                <Footer />
            </div>
        </aside>
    );
}
