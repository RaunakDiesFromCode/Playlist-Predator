"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SidebarProps = React.HTMLAttributes<HTMLElement> & {
    collapsed?: boolean;
};

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
    ({ className, collapsed = false, children, ...props }, ref) => {
        return (
            <aside
                ref={ref}
                data-collapsed={collapsed ? "true" : "false"}
                className={cn(
                    "group/sidebar relative flex h-full min-h-0 flex-col overflow-hidden border-r border-border/70 bg-background/95 backdrop-blur transition-[width] duration-200 ease-out",
                    collapsed ? "w-16" : "w-72",
                    className,
                )}
                {...props}
            >
                {children}
            </aside>
        );
    },
);
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("shrink-0", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex min-h-0 flex-1 flex-col", className)}
        {...props}
    />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("shrink-0", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";

export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader };
