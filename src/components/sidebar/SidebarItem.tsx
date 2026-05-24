import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SidebarItem({
    title,
    href,
    active,
    collapsed,
    onClickAction,
}: {
    title: string;
    href: string;
    active?: boolean;
    collapsed?: boolean;
    onClickAction?: () => void;
}) {
    const initial = title.trim().charAt(0).toUpperCase() || "?";

    return (
        <Link
            href={href}
            onClick={onClickAction}
            className={cn(
                "group flex items-center rounded-md py-2 text-sm transition-all my-1",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active
                    ? "border border-primary/10 bg-primary/10 font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
            )}
        >
            <span
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                    active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                )}
            >
                {initial}
            </span>

            <span
                className={cn(
                    "min-w-0 flex-1 truncate",
                    collapsed && "sr-only",
                )}
            >
                {title}
            </span>
        </Link>
    );
}
