"use client";

import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Body({ children }: { children: React.ReactNode }) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const isHome = pathname === "/";

    useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
            return;
        }

        if (!("serviceWorker" in navigator)) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            navigator.serviceWorker.register("/sw.js").catch(() => undefined);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

    return (
        <body
            className={
                isHome
                    ? "bg-background overflow-hidden"
                    : "bg-background overflow-x-hidden overflow-y-auto"
            }
        >
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="flex min-h-[100dvh] flex-col md:flex-row">
                    <Sidebar
                        user={user}
                        loading={loading}
                        mobileOpen={mobileSidebarOpen}
                        setMobileOpen={setMobileSidebarOpen}
                        collapsed={sidebarCollapsed}
                        setCollapsed={setSidebarCollapsed}
                        onNavigateAction={() => setMobileSidebarOpen(false)}
                    />

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                        <Navbar
                            user={user}
                            loading={loading}
                            toggleSidebar={() => {
                                if (window.innerWidth >= 768) {
                                    setSidebarCollapsed((value) => !value);
                                    return;
                                }

                                setMobileSidebarOpen((value) => !value);
                            }}
                        />

                        <main className="min-h-0 flex-1 transition-all duration-200">
                            {children}
                        </main>
                    </div>
                </div>
            </ThemeProvider>
        </body>
    );
}
