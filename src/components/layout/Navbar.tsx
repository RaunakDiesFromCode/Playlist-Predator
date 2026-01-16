"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Search, Sidebar, User, LogOut, SunMoon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "../ThemeToggle";
import { useAuth } from "@/hooks/use-auth";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavbarProps = {
    toggleSidebar: () => void;
};

const Navbar = ({ toggleSidebar }: NavbarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const [input, setInput] = useState("");

    const isHome = pathname === "/";
    const showSearch = !isHome;

    const { user, loading } = useAuth();

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

    async function handleLogout() {
        const { supabase } = await import("@/lib/supabase/client");
        await supabase.auth.signOut();
        router.push("/login");
    }

    return (
        <nav className="sticky top-0 z-50 bg-background backdrop-blur border-b border-border">
            <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-3">
                {/* LEFT */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                        className="h-11 w-11"
                    >
                        <Sidebar className="h-6 w-6" />
                    </Button>

                    <Link
                        href="/"
                        className="hidden md:flex items-center gap-2 font-semibold text-lg"
                    >
                        <Image
                            src="/logo.gif"
                            alt="Playlist Predator"
                            width={36}
                            height={36}
                            className="rounded"
                        />
                        Playlist Predator
                    </Link>
                </div>

                {/* CENTER */}
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

                {/* RIGHT — DESKTOP */}
                <div className="hidden md:flex items-center gap-3 ml-auto">
                    {!loading &&
                        (user ? (
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-muted-foreground">
                                    Hi,
                                </span>
                                <span className="font-medium truncate max-w-[120px]">
                                    {user.name ?? user.email}
                                </span>
                            </div>
                        ) : (
                            <Button asChild variant="outline">
                                <Link href="/login">Login</Link>
                            </Button>
                        ))}

                    <ThemeToggle />
                </div>

                {/* RIGHT — MOBILE */}
                <div className="md:hidden ml-auto flex items-center">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Open profile menu"
                                    className="h-11 w-11"
                                >
                                    <User className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            Signed in as
                                        </p>
                                        <p className="text-sm font-medium truncate">
                                            {user.name ?? user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => {
                                        document.documentElement.classList.toggle(
                                            "dark"
                                        );
                                    }}
                                >
                                    <SunMoon className="h-4 w-4" />
                                    Toggle theme
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        !loading && (
                            <Button asChild variant="outline" size="sm">
                                <Link href="/login">Login</Link>
                            </Button>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
