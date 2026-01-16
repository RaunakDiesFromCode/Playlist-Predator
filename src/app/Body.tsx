"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
// import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useState } from "react";

export default function Body({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <body className="bg-background overflow-x-hidden">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <Navbar
                    toggleSidebar={() => setSidebarOpen((v) => !v)}
                />

                {/* Mobile backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <Sidebar
                    open={sidebarOpen}
                    onNavigateAction={() => setSidebarOpen(false)}
                />

                <main className="min-h-screen transition-all duration-200">
                    {children}
                </main>
            </ThemeProvider>
        </body>
    );
}

