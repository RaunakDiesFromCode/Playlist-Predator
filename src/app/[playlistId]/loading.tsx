import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex gap-4 p-4">
            <div className="h-[calc(100dvh-6rem)] w-full space-y-4 overflow-hidden rounded-xl">
                <Skeleton className="h-64 w-full rounded-xl" />
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <Skeleton className="h-20 w-32 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden h-[calc(100dvh-6rem)] w-full space-y-4 overflow-y-auto md:block">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}
