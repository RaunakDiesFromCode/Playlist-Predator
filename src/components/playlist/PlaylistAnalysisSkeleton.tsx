import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function StatSkeleton() {
    return (
        <div className="space-y-2 rounded-md border px-3 py-2.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
        </div>
    );
}

function FilterSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-2 lg:w-[280px] lg:flex-none">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
        </div>
    );
}

function PlaylistVideoRowSkeleton() {
    return (
        <div className="rounded-xl border border-border p-3 sm:p-4">
            <div className="flex gap-3 sm:gap-4">
                <Skeleton className="h-20 w-32 shrink-0 rounded-lg" />

                <div className="min-w-0 flex-1 space-y-3">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PlaylistAnalysisSkeleton() {
    return (
        <div className="mt-8 space-y-8">
            <Card className="h-full flex flex-col justify-center">
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                    <CardTitle className="text-lg">
                        <Skeleton className="h-5 w-32" />
                    </CardTitle>
                    <Skeleton className="h-6 w-24 rounded-full" />
                </CardHeader>

                <CardContent className="space-y-4 md:space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-full rounded-full" />
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-3">
                        <StatSkeleton />
                        <StatSkeleton />
                        <div className="space-y-2 rounded-md border px-3 py-2.5 md:flex md:flex-col md:justify-center">
                            <Skeleton className="h-3 w-24" />
                            <div className="flex items-end gap-1">
                                <Skeleton className="h-10 w-14" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Skeleton className="h-4 w-36" />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-md border px-3 py-2.5"
                                >
                                    <Skeleton className="h-4 w-10" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3 text-sm">
                        <Skeleton className="h-4 w-28" />

                        <div className="space-y-3 md:hidden">
                            <div className="flex gap-3">
                                <div className="min-w-0 flex-1 rounded-md border px-3 py-2.5 space-y-2">
                                    <Skeleton className="h-3 w-10" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-28" />
                                </div>

                                <div className="min-w-0 rounded-md border px-3 py-2.5 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <Skeleton className="h-3 w-12" />
                                        <Skeleton className="h-3 w-8" />
                                    </div>

                                    <div className="grid w-max grid-cols-7 gap-1.5">
                                        {Array.from({ length: 14 }).map(
                                            (_, index) => (
                                                <Skeleton
                                                    key={index}
                                                    className="h-2.5 w-2.5 rounded-sm"
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border px-3 py-2.5 space-y-2">
                                <Skeleton className="h-3 w-14" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>

                            <div className="rounded-md border px-3 py-2.5 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-11/12" />
                            </div>
                        </div>

                        <div className="hidden md:flex gap-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-md border px-3 py-2.5 space-y-2">
                                    <Skeleton className="h-3 w-10" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-28" />
                                </div>

                                <div className="rounded-md border px-3 py-2.5 space-y-2">
                                    <Skeleton className="h-3 w-14" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-20" />
                                </div>

                                <div className="sm:col-span-2 rounded-md border px-3 py-2.5 space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-11/12" />
                                </div>
                            </div>

                            <div className="grid w-fit grid-cols-7 gap-1.5">
                                {Array.from({ length: 56 }).map((_, index) => (
                                    <Skeleton
                                        key={index}
                                        className="h-2.5 w-2.5 rounded-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex h-full flex-col overflow-y-auto overscroll-contain rounded-xl border border-border">
                <div className="sticky top-0 z-0">
                    <Skeleton className="h-[220px] w-full rounded-none md:h-[280px]" />
                </div>

                <div className="relative z-10 mt-2 flex-1 space-y-2 px-1">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <PlaylistVideoRowSkeleton key={index} />
                    ))}
                </div>

                <div className="sticky bottom-0 z-20 mt-auto border-t border-border/60 bg-background/95 px-3 py-3 backdrop-blur">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <Skeleton className="h-9 flex-1 rounded-md lg:flex-[2]" />
                        <FilterSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
}
