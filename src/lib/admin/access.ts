export function getConfiguredAdminEmails(): string[] {
    const envValue =
        process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";

    return envValue
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
    if (!email) return false;

    return getConfiguredAdminEmails().includes(email.toLowerCase());
}

export function isAdminRole(role?: string | null): boolean {
    if (!role) return false;
    return role.toLowerCase() === "admin";
}
