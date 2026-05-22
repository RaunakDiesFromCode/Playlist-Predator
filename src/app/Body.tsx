"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function Body({ children }: { children: React.ReactNode }) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const { user, loading } = useAuth();

    return (
        <body className="bg-background overflow-x-hidden">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="min-h-screen md:flex">
                    <Sidebar
                        user={user}
                        loading={loading}
                        mobileOpen={mobileSidebarOpen}
                        setMobileOpen={setMobileSidebarOpen}
                        collapsed={sidebarCollapsed}
                        setCollapsed={setSidebarCollapsed}
                        onNavigateAction={() => setMobileSidebarOpen(false)}
                    />

                    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
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
