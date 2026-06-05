"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, memo } from "react";

import {
    BarChart3,
    Home,
    LogOut,
    Scale,
    Sidebar,
    User,
    ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "../ThemeToggle";
import { type AuthUser } from "@/hooks/use-auth";
import { useAdminAccess } from "@/hooks/use-admin-access";

type NavbarProps = {
    toggleSidebar: () => void;
    user: AuthUser | null;
    loading: boolean;
};

const Navbar = ({ toggleSidebar, user, loading }: NavbarProps) => {
    const router = useRouter();
    const { canAccess: showAdminLink } = useAdminAccess();

    // Stable reference prevents child re-renders on parent updates
    const handleLogout = useCallback(async () => {
        const { supabase } = await import("@/lib/supabase/client");
        await supabase.auth.signOut();
        router.push("/login");
    }, [router]);

    return (
        <nav
            className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90"
            aria-label="Main"
        >
            {/* padding for iOS safe area (notch) */}
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
                {/* Skip navigation link for keyboard users */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
                >
                    Skip to main content
                </a>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                        className="h-11 w-11 md:hidden"
                    >
                        <Sidebar className="h-6 w-6" />
                    </Button>

                    <Link
                        href="/"
                        className="hidden md:flex items-center gap-2 font-semibold text-lg"
                    >
                        {/* Image is decorative — link text already labels it */}
                        <Image
                            src="/logo.gif"
                            alt=""
                            aria-hidden="true"
                            width={36}
                            height={36}
                            className="rounded"
                        />
                        Playlist Predator
                    </Link>
                </div>

                <div className="ml-auto flex items-center gap-2 md:gap-3">
                    {!loading &&
                        (user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-11 max-w-[220px] justify-start gap-1 px-3"
                                        aria-label="Open profile menu"
                                    >
                                        <span className="text-muted-foreground">
                                            Hi,
                                        </span>
                                        <span className="truncate font-medium">
                                            {user.name ?? user.email}
                                        </span>
                                        <ChevronDown />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-36"
                                >
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

                                    <DropdownMenuItem asChild>
                                        <Link href="/">
                                            <Home className="h-4 w-4" aria-hidden="true" />
                                            Home
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link href="/compare">
                                            <Scale className="h-4 w-4" aria-hidden="true" />
                                            Compare
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link href="/stats">
                                            <BarChart3 className="h-4 w-4" aria-hidden="true" />
                                            Statistics
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem>
                                        <ThemeToggle />
                                    </DropdownMenuItem>

                                    {showAdminLink && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin">
                                                <User className="h-4 w-4" aria-hidden="true" />
                                                Admin
                                            </Link>
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" aria-hidden="true" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild variant="outline">
                                <Link href="/login">Login</Link>
                            </Button>
                        ))}
                </div>
            </div>
        </nav>
    );
};

export default memo(Navbar);
