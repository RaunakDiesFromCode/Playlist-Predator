import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { comparePlaylists } from "@/lib/comparison/compare-playlists";

type ComparisonRequestBody = {
    inputs?: string[];
};

export async function POST(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json()) as ComparisonRequestBody;
        const inputs = Array.isArray(body.inputs) ? body.inputs : [];

        if (inputs.filter((value) => value.trim()).length < 2) {
            return NextResponse.json(
                { error: "Provide at least two playlist URLs or IDs." },
                { status: 400 },
            );
        }

        const result = await comparePlaylists(inputs);

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to compare playlists.",
            },
            { status: 500 },
        );
    }
}
