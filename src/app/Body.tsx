"use client"

import React from 'react'
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/sidebar/Sidebar";
// import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useState } from "react";

export default function Body({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
      <body className="bg-background">
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
              <Navbar
                  sidebarOpen={sidebarOpen}
                  toggleSidebar={() => setSidebarOpen((v) => !v)}
              />

              {/* Sidebar OVERLAY */}
              <Sidebar open={sidebarOpen} />

              {/* Main content stays full-width */}
              <main className="min-h-screen">{children}</main>

              <Footer />
          </ThemeProvider>
      </body>
  );
}

