import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function pingSupabase(req: NextRequest) {
    // Optional secret check: If CRON_SECRET is set in environment, require it
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get("authorization");
        const url = new URL(req.url);
        const secretParam = url.searchParams.get("key");
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7).trim()
            : null;

        if (bearerToken !== cronSecret && secretParam !== cronSecret) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            {
                success: false,
                error: "Missing Supabase configuration environment variables",
            },
            { status: 500 }
        );
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        // Perform a lightweight read query to wake/keep awake the database.
        // We query 1 id from the 'playlists' table, which produces a minimal
        // SELECT query on PostgreSQL without modifying any data.
        const { error } = await supabase
            .from("playlists")
            .select("id")
            .limit(1);

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Supabase database keepalive ping successful",
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Unexpected server error";
        return NextResponse.json(
            {
                success: false,
                error: message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    return pingSupabase(req);
}

export async function POST(req: NextRequest) {
    return pingSupabase(req);
}
