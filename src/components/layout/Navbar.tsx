"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, memo, useState } from "react";

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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    const [menuOpen, setMenuOpen] = useState(false);

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
            <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
                {/* Skip navigation link for keyboard users */}
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow"
                >
                    Skip to main content
                </a>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                        className="h-10 w-10 shrink-0 md:hidden"
                    >
                        <Sidebar className="h-5 w-5" />
                    </Button>

                    <Link
                        href="/"
                        className="flex items-center gap-2 font-semibold text-sm sm:text-base md:text-lg truncate"
                    >
                        {/* Image is decorative — link text already labels it */}
                        <Image
                            src="/apple-touch-icon.png"
                            alt=""
                            aria-hidden="true"
                            width={32}
                            height={32}
                            className="h-7 w-7 md:h-8 md:w-8 shrink-0 rounded"
                        />
                        <span className="truncate">Playlist Predator</span>
                    </Link>
                </div>

                <div className="ml-auto flex items-center gap-1.5 md:gap-3 shrink-0">
                    {!loading &&
                        (user ? (
                            <DropdownMenu onOpenChange={(open) => setMenuOpen(open)}>
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip open={menuOpen ? false : undefined}>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-10 max-w-[120px] sm:max-w-[220px] justify-start gap-1 px-2 sm:px-3"
                                                    aria-label="Open profile menu"
                                                >
                                                    <span className="text-muted-foreground hidden sm:inline">
                                                        Hi,
                                                    </span>
                                                    <span className="truncate font-medium text-xs sm:text-sm">
                                                        {user.name ?? user.email}
                                                    </span>
                                                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Profile menu</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-56"
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
                                        <Link href="/insights">
                                            <BarChart3 className="h-4 w-4" aria-hidden="true" />
                                            Insights
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <ThemeToggle variant="button" className="h-9 w-9 text-muted-foreground hover:text-foreground" />
                                <Button asChild variant="outline" size="sm" className="h-9 px-3">
                                    <Link href="/login">Login</Link>
                                </Button>
                            </div>
                        ))}
                </div>
            </div>
        </nav>
    );
};

export default memo(Navbar);
