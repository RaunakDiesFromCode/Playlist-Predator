import { cn } from "@/lib/utils";

type StatsGridProps = {
    children: React.ReactNode;
    className?: string;
};

export default function StatsGrid({ children, className }: StatsGridProps) {
    return (
        <div
            className={cn(
                "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
                className,
            )}
        >
            {children}
        </div>
    );
}
