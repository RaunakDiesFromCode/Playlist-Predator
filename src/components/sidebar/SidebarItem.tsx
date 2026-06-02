import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    thumbnail?: string | null;
    collapsed?: boolean;
    onClickAction?: () => void;
}) {
    const initial = title.trim().charAt(0).toUpperCase() || "?";

    const item = (
        <Link
            href={href}
            onClick={onClickAction}
            className={cn(
                "group my-1 flex w-full min-w-0 items-center justify-start overflow-hidden rounded-none py-2 text-sm transition-all",
                collapsed ? "px-2" : "gap-3 px-3",
                active
                    ? "border border-primary/10 bg-primary/10 font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
            )}
        >
            <span
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-none text-[11px] font-semibold transition-colors",
                    active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                )}
            >
                {initial}
            </span>

            <span
                className={cn(
                    "block min-w-0 truncate",
                    !collapsed &&
                        "w-[50%] max-w-[50%] md:w-[11.5rem] md:max-w-[11.5rem]",
                    collapsed && "sr-only",
                )}
            >
                {title}
            </span>
        </Link>
    );

    if (!collapsed) {
        return item;
    }

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{title}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
