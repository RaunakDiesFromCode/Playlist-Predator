"use client";

import { memo } from "react";

type ResponsiveTableProps = {
    children: React.ReactNode;
};

function ResponsiveTableComponent({ children }: ResponsiveTableProps) {
    return (
        <div className="my-3 overflow-x-auto rounded-none border border-border">
            <div className="min-w-full [&>table]:my-0 [&>table]:w-full [&>table]:border-collapse [&>table]:text-xs">
                {children}
            </div>
        </div>
    );
}

export const ResponsiveTable = memo(ResponsiveTableComponent);
