import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { isAdminEmail, isAdminRole } from "@/lib/admin/access";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { fetchPlaylistVideoIds } from "@/lib/youtube/client";
import AdminUserSwitcher from "./AdminUserSwitcher";

function formatDate(value: string | null): string {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString();
}

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

function normalizeStatus(status: string) {
    return (status || "UNKNOWN").trim().toUpperCase();
}

function getStatusBadgeClass(status: string) {
    const normalized = normalizeStatus(status);

    if (normalized === "DONE") {
        return "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    }

    if (normalized === "SKIP") {
        return "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
    }

    if (normalized === "REWATCH") {
        return "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    }

    if (normalized === "NONE") {
        return "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300";
    }

    return "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300";
}

function getStatusBarClass(status: string) {
    const normalized = normalizeStatus(status);

    if (normalized === "DONE") {
        return "bg-emerald-500";
    }

    if (normalized === "SKIP") {
        return "bg-rose-500";
    }

    if (normalized === "REWATCH") {
        return "bg-amber-500";
    }

    if (normalized === "NONE") {
        return "bg-slate-500";
    }

    return "bg-sky-500";
}

function getRoleBadgeClass(role: string) {
    const normalizedRole = (role || "user").toLowerCase();

    if (normalizedRole === "admin") {
        return "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300";
    }

    return "border-cyan-300 bg-cyan-100 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300";
}

function getStatusOrder(status: string) {
    const normalized = normalizeStatus(status);

    if (normalized === "DONE") return 0;
    if (normalized === "SKIP") return 1;
    if (normalized === "REWATCH") return 2;
    return 3;
}

async function getVideoTitleMap(videoIds: string[]) {
    const uniqueIds = [...new Set(videoIds.filter(Boolean))];
    const titleMap = new Map<string, string>();

    if (uniqueIds.length === 0) {
        return titleMap;
    }

    try {
        const { fetchVideoDetails } = await import("@/lib/youtube/client");
        const videoDetails = await fetchVideoDetails(uniqueIds);

        for (const video of videoDetails) {
            const id = typeof video.id === "string" ? video.id : null;
            const title =
                typeof video.snippet?.title === "string"
                    ? video.snippet.title
                    : null;

            if (id && title) {
                titleMap.set(id, title);
            }
        }
    } catch {
        // Keep fallback labels when YouTube data is unavailable.
    }

    return titleMap;
}

async function getPlaylistTotalVideos(playlistId: string) {
    try {
        return (await fetchPlaylistVideoIds(playlistId)).length;
    } catch {
        return null;
    }
}

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ userId?: string }>;
}) {
    const params = (await searchParams) ?? {};
    const selectedUserIdParam = params.userId ?? null;

    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const userRole =
        (user.app_metadata?.role as string | undefined) ??
        (user.user_metadata?.role as string | undefined) ??
        null;

    const canAccess = isAdminEmail(user.email) || isAdminRole(userRole);

    if (!canAccess) {
        return (
            <section className="mx-auto w-full max-w-7xl p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Unauthorized</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            Your account is not allowed to access this admin
                            page.
                        </p>
                        <p>
                            Add your email to <strong>ADMIN_EMAILS</strong>{" "}
                            (comma-separated) or set your Supabase role metadata
                            to admin.
                        </p>
                    </CardContent>
                </Card>
            </section>
        );
    }

    let dashboard;

    try {
        dashboard = await getAdminDashboardData();
    } catch (error) {
        return (
            <section className="mx-auto w-full max-w-7xl p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin data unavailable</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            {(error as Error).message ||
                                "Unable to load dashboard data."}
                        </p>
                        <p>
                            Ensure <strong>SUPABASE_SERVICE_ROLE_KEY</strong> is
                            configured in your environment.
                        </p>
                    </CardContent>
                </Card>
            </section>
        );
    }

    const selectedUserId =
        selectedUserIdParam &&
        dashboard.userBreakdown.some(
            (userInfo) => userInfo.userId === selectedUserIdParam,
        )
            ? selectedUserIdParam
            : (dashboard.userBreakdown[0]?.userId ?? null);

    const selectedUser =
        dashboard.userBreakdown.find(
            (item) => item.userId === selectedUserId,
        ) ?? null;

    const selectedUserPlaylists = selectedUserId
        ? dashboard.playlists.filter(
              (playlist) => playlist.user_id === selectedUserId,
          )
        : [];

    const selectedUserProgressRows = selectedUserId
        ? dashboard.progressRows.filter(
              (progress) => progress.user_id === selectedUserId,
          )
        : [];

    const doneCountsByPlaylistId = new Map<string, number>();
    const selectedUserStatusMap = new Map<string, number>();

    for (const row of selectedUserProgressRows) {
        const status = normalizeStatus(row.status);

        selectedUserStatusMap.set(
            status,
            (selectedUserStatusMap.get(status) ?? 0) + 1,
        );

        if (status === "DONE") {
            doneCountsByPlaylistId.set(
                row.playlist_id,
                (doneCountsByPlaylistId.get(row.playlist_id) ?? 0) + 1,
            );
        }
    }

    const [videoTitleMap, selectedUserPlaylistStats] = await Promise.all([
        getVideoTitleMap(
            selectedUserProgressRows.map((progress) => progress.video_id),
        ),
        Promise.all(
            selectedUserPlaylists.map(async (playlist) => {
                const totalVideos = await getPlaylistTotalVideos(
                    playlist.youtube_playlist_id,
                );

                return {
                    ...playlist,
                    doneVideos:
                        doneCountsByPlaylistId.get(
                            playlist.youtube_playlist_id,
                        ) ?? 0,
                    totalVideos:
                        totalVideos ??
                        selectedUserProgressRows.filter(
                            (progress) =>
                                progress.playlist_id ===
                                playlist.youtube_playlist_id,
                        ).length,
                };
            }),
        ),
    ]);

    const selectedUserStatuses = ["DONE", "SKIP", "REWATCH"]
        .map((status) => ({
            status,
            count: selectedUserStatusMap.get(status) ?? 0,
        }))
        .sort((a, b) => getStatusOrder(a.status) - getStatusOrder(b.status));

    const selectedUserExtraStatuses = [...selectedUserStatusMap.entries()]
        .filter(([status]) => !["DONE", "SKIP", "REWATCH"].includes(status))
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

    const selectedUserStatusTotal = selectedUserProgressRows.length;

    return (
        <section className="mx-auto w-full max-w-[1500px] space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Platform-wide analytics for playlists and progress data.
                    </p>
                </div>

                <Badge variant="secondary">
                    Signed in as {user.email ?? "unknown email"}
                </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {dashboard.totals.users}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-fuchsia-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Playlists
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {dashboard.totals.playlists}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Progress Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {dashboard.totals.progressRows}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Users (7d)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {dashboard.totals.activeUsersLast7Days}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Selected User Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {selectedUserStatuses.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No progress data yet.
                            </p>
                        )}

                        {selectedUserStatuses.map((status) => {
                            const width =
                                selectedUserStatusTotal === 0
                                    ? 0
                                    : Math.round(
                                          (status.count /
                                              selectedUserStatusTotal) *
                                              100,
                                      );

                            return (
                                <div key={status.status} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="inline-flex items-center gap-2 font-medium">
                                            <span
                                                className={cn(
                                                    "h-2.5 w-2.5 rounded-none",
                                                    getStatusBarClass(
                                                        status.status,
                                                    ),
                                                )}
                                            />
                                            {normalizeStatus(status.status)}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {status.count} ({width}%)
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-none bg-muted">
                                        <div
                                            className={cn(
                                                "h-2 rounded-none",
                                                getStatusBarClass(
                                                    status.status,
                                                ),
                                            )}
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {selectedUserExtraStatuses.length > 0 && (
                            <div className="pt-2 text-xs text-muted-foreground">
                                Other statuses:{" "}
                                {selectedUserExtraStatuses
                                    .map(
                                        (status) =>
                                            `${normalizeStatus(status.status)} (${status.count})`,
                                    )
                                    .join(", ")}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AdminUserSwitcher
                            users={dashboard.userBreakdown}
                            selectedUserId={selectedUserId}
                        />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Selected User</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedUser ? (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={getRoleBadgeClass(
                                        selectedUser.role || "user",
                                    )}
                                >
                                    {selectedUser.role || "user"}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-fuchsia-300 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300"
                                >
                                    {selectedUser.playlists} playlists
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                >
                                    {selectedUser.progressEvents} progress rows
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {userLabel(
                                        selectedUser.name,
                                        selectedUser.email,
                                        selectedUser.userId,
                                    )}
                                </span>
                            </div>

                            <p className="font-mono text-xs text-muted-foreground">
                                User ID: {selectedUser.userId}
                            </p>

                            {selectedUserStatuses.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedUserStatuses.map((statusInfo) => (
                                        <Badge
                                            key={statusInfo.status}
                                            variant="outline"
                                            className={getStatusBadgeClass(
                                                statusInfo.status,
                                            )}
                                        >
                                            {normalizeStatus(statusInfo.status)}
                                            : {statusInfo.count}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Select a user to inspect their data.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Selected User Playlists ({selectedUserPlaylists.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table className="min-w-[980px] text-left">
                        <TableHeader>
                            <TableRow className="text-xs uppercase text-muted-foreground hover:bg-transparent">
                                <TableHead>Playlist Row ID</TableHead>
                                <TableHead>YouTube Playlist ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Done / Total</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">
                                    Visit
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedUserPlaylistStats.map((playlist) => (
                                <TableRow key={playlist.id}>
                                    <TableCell className="font-mono text-xs">
                                        {compactId(playlist.id)}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {playlist.youtube_playlist_id}
                                    </TableCell>
                                    <TableCell>
                                        {playlist.title || "Untitled"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        >
                                            {playlist.doneVideos}/
                                            {playlist.totalVideos}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(playlist.created_at)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(playlist.updated_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <a
                                                href={`https://www.youtube.com/playlist?list=${playlist.youtube_playlist_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Visit
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {selectedUserPlaylists.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="py-6 text-center text-muted-foreground"
                                    >
                                        No playlists for this user.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Selected User Playlist Progress Rows (
                        {selectedUserProgressRows.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table className="min-w-[1240px] text-left">
                        <TableHeader>
                            <TableRow className="text-xs uppercase text-muted-foreground hover:bg-transparent">
                                <TableHead>ID</TableHead>
                                <TableHead>Playlist</TableHead>
                                <TableHead>Video ID</TableHead>
                                <TableHead>Video Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">
                                    Visit
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedUserProgressRows.map((progress) => (
                                <TableRow key={progress.id}>
                                    <TableCell className="font-mono text-xs">
                                        {compactId(progress.id)}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {progress.playlist_id}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {progress.video_id}
                                    </TableCell>
                                    <TableCell className="max-w-[420px] truncate">
                                        {videoTitleMap.get(progress.video_id) ??
                                            "Unknown video"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={getStatusBadgeClass(
                                                progress.status,
                                            )}
                                        >
                                            {normalizeStatus(progress.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(progress.updated_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <a
                                                href={`https://www.youtube.com/watch?v=${progress.video_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Visit
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {selectedUserProgressRows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="py-6 text-center text-muted-foreground"
                                    >
                                        No progress rows for this user.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </section>
    );
}
