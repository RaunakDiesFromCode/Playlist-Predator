"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UserInfo = {
    userId: string;
    playlists: number;
    progressEvents: number;
    email: string | null;
    name: string | null;
    role: string;
};

type AdminUserSwitcherProps = {
    users: UserInfo[];
    selectedUserId: string | null;
};

function compactId(value: string): string {
    if (value.length <= 12) return value;
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function userLabel(name: string | null, email: string | null, userId: string) {
    if (name && email) return `${name} (${email})`;
    if (name) return name;
    if (email) return email;
    return compactId(userId);
}

export default function AdminUserSwitcher({
    users,
    selectedUserId,
}: AdminUserSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);

    useEffect(() => {
        if (pendingUserId && pendingUserId === selectedUserId && !isPending) {
            setPendingUserId(null);
        }
    }, [pendingUserId, selectedUserId, isPending]);

    function selectUser(userId: string) {
        if (userId === selectedUserId) return;

        setPendingUserId(userId);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("userId", userId);
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            });
        });
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Users</p>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {isPending || pendingUserId
                        ? "Loading user data"
                        : `${users.length} total`}
                </span>
            </div>

            <div className="space-y-2">
                {users.map((user) => {
                    const isSelected = selectedUserId === user.userId;
                    const isSwitching =
                        pendingUserId === user.userId && isPending;

                    return (
                        <button
                            key={user.userId}
                            type="button"
                            onClick={() => selectUser(user.userId)}
                            disabled={isSwitching}
                            aria-busy={isSwitching}
                            className={cn(
                                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                isSelected
                                    ? "border-primary/40 bg-primary/10"
                                    : "hover:bg-muted/50",
                                isSwitching && "opacity-70",
                            )}
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {userLabel(
                                        user.name,
                                        user.email,
                                        user.userId,
                                    )}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {compactId(user.userId)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="border-fuchsia-300 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300"
                                >
                                    {user.playlists}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                >
                                    {user.progressEvents}
                                </Badge>
                                {isSwitching && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                        </button>
                    );
                })}

                {users.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No users yet.
                    </p>
                )}
            </div>
        </div>
    );
}
