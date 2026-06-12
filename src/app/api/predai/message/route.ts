import { NextRequest, NextResponse } from "next/server";

import { saveMessage } from "@/lib/predai/db";

export async function POST(req: NextRequest) {
    try {
        const { conversationId, role, content } = await req.json();

        await saveMessage(conversationId, role, content);

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to save message",
            },
            {
                status: 500,
            },
        );
    }
}
