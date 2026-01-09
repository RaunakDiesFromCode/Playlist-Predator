"use client";

import Image from "next/image";
import { GithubIcon, Search, Sidebar } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type UserInfo = {
    email: string;
    name?: string;
};

type NavbarProps = {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Navbar = ({ sidebarOpen, toggleSidebar }: NavbarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const [input, setInput] = useState("");

    const isHome = pathname === "/";
    const showSearch = !isHome;

    const [user, setUser] = useState<UserInfo | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser({
                    email: data.user.email!,
                    name: data.user.user_metadata?.name,
                });
            } else {
                setUser(null);
            }
            setLoadingAuth(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    email: session.user.email!,
                    name: session.user.user_metadata?.name,
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    function extractPlaylistId(value: string) {
        try {
            if (value.includes("youtube.com")) {
                return new URL(value).searchParams.get("list");
            }
            return value.trim();
        } catch {
            return null;
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const id = extractPlaylistId(input);
        if (!id) return;
        setInput("");
        router.push(`/${id}`);
    }

    return (
        <nav className="sticky top-0 z-50 bg-background backdrop-blur border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
                {/* Left: Logo */}
                <div className="flex items-center gap-2 shrink-0">
                    {user && (<Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <Sidebar />
                    </Button>)}

                    <Image
                        src="/logo.gif"
                        alt="Playlist Predator"
                        width={36}
                        height={36}
                        className="rounded"
                    />
                    <Link
                        href="/"
                        className="font-semibold text-foreground text-lg"
                    >
                        Playlist Predator
                    </Link>
                </div>

                {/* Center: Search */}
                {showSearch && (
                    <form
                        onSubmit={handleSearch}
                        className="flex-1 max-w-xl mx-auto"
                    >
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                            />
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste playlist link or ID"
                                className="pl-9"
                            />
                        </div>
                    </form>
                )}

                {/* Right: Controls */}
                <div className="flex items-center gap-3 ml-auto">
                    {!loadingAuth &&
                        (user ? (
                            <>
                                <span className="text-sm text-muted-foreground">
                                    {user.name ?? user.email}
                                </span>
                                <Button
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        router.push("/login");
                                    }}
                                    variant="outline"
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm px-3 py-1 rounded border"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="text-sm px-3 py-1 rounded border"
                                >
                                    Register
                                </Link>
                            </>
                        ))}

                    <ThemeToggle />

                    <Link
                        href="https://github.com/Aymaan-Shabbir"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                    >
                        <GithubIcon size={20} />
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
