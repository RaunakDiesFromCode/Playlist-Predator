import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getCorsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
    };
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
    const corsHeaders = getCorsHeaders(req);
    try {
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                { authenticated: false, user: null },
                { status: 401, headers: corsHeaders },
            );
        }

        const {
            data: { session },
        } = await supabase.auth.getSession();

        return NextResponse.json(
            {
                authenticated: true,
                token: session?.access_token || null,
                user: {
                    id: user.id,
                    email: user.email,
                },
            },
            { status: 200, headers: corsHeaders },
        );
    } catch {
        return NextResponse.json(
            { authenticated: false, user: null },
            { status: 500, headers: corsHeaders },
        );
    }
}
