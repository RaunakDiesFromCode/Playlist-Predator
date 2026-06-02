import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-none" />
            ))}
        </div>
    );
}
