import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
    label: string;
    value: string;
    description?: string;
    icon?: React.ReactNode;
    className?: string;
};

export default function StatCard({
    label,
    value,
    description,
    icon,
    className,
}: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>
                    {icon ? (
                        <div className="rounded-full border bg-muted/60 p-2 text-muted-foreground">
                            {icon}
                        </div>
                    ) : null}
                </div>
                <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {value}
                </p>
                {description ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}
