export default function Loading() {
    return (
        <div className="flex gap-4 p-4">
            <div className="h-[calc(100dvh-6rem)] w-full animate-pulse space-y-4 overflow-hidden rounded-xl">
                <div className="h-64 w-full rounded-xl bg-muted/60" />
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <div className="h-20 w-32 rounded-lg bg-muted/60" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-muted/60" />
                            <div className="h-4 w-1/2 rounded bg-muted/60" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden h-[calc(100dvh-6rem)] w-full animate-pulse space-y-4 overflow-y-auto md:block">
                <div className="h-8 w-1/3 rounded bg-muted/60" />
                <div className="h-24 w-full rounded-lg bg-muted/60" />
                <div className="h-24 w-full rounded-lg bg-muted/60" />
                <div className="h-24 w-full rounded-lg bg-muted/60" />
            </div>
        </div>
    );
}
