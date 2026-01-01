"use client";

import Image from "next/image";
import { GithubIcon, Search } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "../ui/input";
import Link from "next/link";

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [input, setInput] = useState("");

    const isHome = pathname === "/";
    const showSearch = !isHome;

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

                {/* Center: Search (playlist pages only) */}
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
                    <ThemeToggle />

                    <a
                        href="https://github.com/Aymaan-Shabbir"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        className="text-foreground hover:text-primary transition"
                    >
                        <GithubIcon size={20} />
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
