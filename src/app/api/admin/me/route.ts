import { NextResponse } from "next/server";

import { isAdminEmail, isAdminRole } from "@/lib/admin/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ canAccess: false }, { status: 200 });
    }

    const role =
        (user.app_metadata?.role as string | undefined) ??
        (user.user_metadata?.role as string | undefined) ??
        null;

    const canAccess = isAdminEmail(user.email) || isAdminRole(role);

    return NextResponse.json({ canAccess }, { status: 200 });
}
