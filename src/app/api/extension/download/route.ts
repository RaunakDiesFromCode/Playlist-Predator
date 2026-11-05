import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const filePath = path.join(
            process.cwd(),
            "public",
            "playlist-predator-extension.zip"
        );

        if (!fs.existsSync(filePath)) {
            return new NextResponse("Extension zip file not found", {
                status: 404,
            });
        }

        const fileBuffer = await fs.promises.readFile(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition":
                    'attachment; filename="playlist-predator-extension.zip"',
                "Content-Length": fileBuffer.length.toString(),
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
