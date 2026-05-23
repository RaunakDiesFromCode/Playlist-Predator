"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LibraryBig, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar as UiSidebar } from "@/components/ui/sidebar";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { type AuthUser } from "@/hooks/use-auth";
import Footer from "../layout/Footer";
import SidebarItem from "./SidebarItem";
import SidebarSkeleton from "./SidebarSkeleton";
import { isAdminEmail } from "@/lib/admin/access";

type Playlist = {
    id: string;
    youtube_playlist_id: string;
    title: string | null;
};

type SidebarProps = {
    user: AuthUser | null;
    loading: boolean;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    collapsed: boolean;
    setCollapsed: Dispatch<SetStateAction<boolean>>;
    onNavigateAction: () => void;
};

type SidebarContentProps = {
    user: AuthUser | null;
    authLoading: boolean;
    loading: boolean;
    query: string;
    setQuery: (value: string) => void;
    playlists: Playlist[];
    filteredPlaylists: Playlist[];
    pathname: string | null;
    collapsed?: boolean;
    onNavigateAction: () => void;
    onLogin: () => void;
};

const playlistCache = new Map<string, Playlist[]>();
const playlistRequestCache = new Map<string, Promise<Playlist[]>>();

function SidebarContent({
    user,
    authLoading,
    loading,
    query,
    setQuery,
    playlists,
    filteredPlaylists,
    pathname,
    collapsed,
    onNavigateAction,
    onLogin,
}: SidebarContentProps) {
    const showAdminLink = isAdminEmail(user?.email);

    if (!user && !authLoading) {
        return (
            <div className="flex flex-1 min-h-0 items-center justify-center px-4 py-6">
                <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-muted/20 p-5 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <LibraryBig className="h-6 w-6" />
                    </div>
                    <h2 className="text-base font-semibold">Welcome</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Log in to save playlists, track progress, and sync
                        across devices.
                    </p>

                    <Button className="mt-4 w-full" onClick={onLogin}>
                        Login to get started
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="border-b border-border/70 px-4 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <LibraryBig className="h-5 w-5" />
                    </div>

                    <div className={cn("min-w-0", collapsed && "sr-only")}>
                        <p className="text-sm font-semibold">
                            {user ? "Your playlists" : "Welcome"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {user
                                ? `${playlists.length} saved playlist${
                                      playlists.length === 1 ? "" : "s"
                                  }`
                                : "Study smarter, not longer"}
                        </p>
                    </div>
                </div>
            </div>

            <div
                className={cn(
                    "border-b border-border/70 px-3 py-3",
                    collapsed && "sr-only",
                )}
            >
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search playlists..."
                        className="h-10 rounded-xl border-border/70 bg-muted/30 pl-9"
                    />
                </div>

                {query ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {filteredPlaylists.length} match
                        {filteredPlaylists.length === 1 ? "" : "es"}
                    </p>
                ) : null}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 overscroll-contain">
                {loading && <SidebarSkeleton />}

                {!loading && playlists.length === 0 && user && (
                    <div
                        className={cn(
                            "rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground",
                            collapsed && "sr-only",
                        )}
                    >
                        No playlists yet
                    </div>
                )}

                {!loading && showAdminLink && (
                    <SidebarItem
                        title="Admin dashboard"
                        href="/admin"
                        active={pathname === "/admin"}
                        collapsed={collapsed}
                        onClickAction={onNavigateAction}
                    />
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
                                collapsed={collapsed}
                                onClickAction={onNavigateAction}
                            />
                        );
                    })}

                {!loading && filteredPlaylists.length === 0 && query && (
                    <div
                        className={cn(
                            "rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground",
                            collapsed && "sr-only",
                        )}
                    >
                        No matching playlists
                    </div>
                )}
            </div>

            <div
                className={cn(
                    "border-t border-border/70 bg-muted/20 px-4 py-4",
                    collapsed && "sr-only",
                )}
            >
                <Footer />
            </div>
        </>
    );
}

export default function Sidebar({
    user,
    loading: authLoading,
    mobileOpen,
    setMobileOpen,
    collapsed,
    onNavigateAction,
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [query, setQuery] = useState("");

    const filteredPlaylists = playlists.filter((pl) =>
        (pl.title ?? pl.youtube_playlist_id)
            .toLowerCase()
            .includes(query.toLowerCase()),
    );

    const loginAction = useMemo(
        () => () => {
            onNavigateAction();
            setMobileOpen(false);
            router.push("/login");
        },
        [onNavigateAction, router, setMobileOpen],
    );

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setPlaylists([]);
            setLoading(false);
            return;
        }

        const userId = user.id;

        const cachedPlaylists = playlistCache.get(userId);
        if (cachedPlaylists) {
            setPlaylists(cachedPlaylists);
            setLoading(false);
            return;
        }

        async function load() {
            const pendingRequest = playlistRequestCache.get(userId);

            if (pendingRequest) {
                const data = await pendingRequest;
                setPlaylists(data);
                setLoading(false);
                return;
            }

            const request = fetch("/api/playlists")
                .then((res) => res.json())
                .then((data: Playlist[]) => {
                    playlistCache.set(userId, data);
                    playlistRequestCache.delete(userId);
                    return data;
                })
                .catch((error) => {
                    playlistRequestCache.delete(userId);
                    throw error;
                });

            playlistRequestCache.set(userId, request);

            const data = await request;
            setPlaylists(data);
            setLoading(false);
        }

        setLoading(true);
        void load();
    }, [user, authLoading]);

    return (
        <>
            <UiSidebar
                collapsed={collapsed}
                className="hidden md:flex md:sticky md:top-0 md:h-screen md:shrink-0"
            >
                <SidebarContent
                    user={user}
                    authLoading={authLoading}
                    loading={loading}
                    query={query}
                    setQuery={setQuery}
                    playlists={playlists}
                    filteredPlaylists={filteredPlaylists}
                    pathname={pathname}
                    collapsed={collapsed}
                    onNavigateAction={onNavigateAction}
                    onLogin={loginAction}
                />
            </UiSidebar>

            <div className="md:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
                        <div className="sr-only">
                            <SheetHeader>
                                <SheetTitle>Navigation</SheetTitle>
                                <SheetDescription>
                                    Browse and search your playlists.
                                </SheetDescription>
                            </SheetHeader>
                        </div>

                        <div className="flex h-full min-h-0 flex-col bg-background/95 backdrop-blur">
                            <SidebarContent
                                user={user}
                                authLoading={authLoading}
                                loading={loading}
                                query={query}
                                setQuery={setQuery}
                                playlists={playlists}
                                filteredPlaylists={filteredPlaylists}
                                pathname={pathname}
                                collapsed={false}
                                onNavigateAction={onNavigateAction}
                                onLogin={loginAction}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
