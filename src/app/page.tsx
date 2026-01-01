"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
    const [input, setInput] = useState("");
    const router = useRouter();

    function extractPlaylistId(value: string) {
        try {
            if (value.includes("youtube.com")) {
                return new URL(value).searchParams.get("list");
            }
            return value.trim();
        } catch {
            return null;
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const id = extractPlaylistId(input);
        if (!id) return;
        router.push(`/${id}`);
    }

    return (
        <main className="min-h-[70vh] flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl flex gap-2"
            >
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste playlist link or ID"
                />
                <Button>
                    Analyze
                </Button>
            </form>
        </main>
    );
}
