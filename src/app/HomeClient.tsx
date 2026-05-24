"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

const GREETINGS = [
    "Make sense of your YouTube playlist",
    "Turn chaos into watch order",
    "Finish the playlist you abandoned",
    "Track what you watched and skipped",
    "Stop rewatching the same damn video",
    "See where you dropped off",
    "Bring order to your YouTube mess",
    "Turn Watch Later into Watched",
    "Your playlist, finally under control",
    "Because YouTube won’t manage your shit",
    "From endless scroll to actual progress",
    "Understand your binge habits",
    "Tame that out-of-hand playlist",
    "Watch smarter, not longer",
    "Separate gold from algorithmic junk",
];

function pickGreeting() {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

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

export default function HomeClient() {
    const [input, setInput] = useState("");
    const [greetingBase] = useState(pickGreeting);
    const router = useRouter();
    const { user, loading } = useAuth();

    const greeting =
        !loading && user?.name ? `${greetingBase}, ${user.name}` : greetingBase;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const id = extractPlaylistId(input);

        if (!id) return;

        router.push(`/${id}`);
    }

    return (
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
            <div className="flex w-full max-w-xl flex-col gap-4">
                <h1 className="text-center text-2xl font-bold">{greeting}</h1>

                <form
                    onSubmit={handleSubmit}
                    className="flex w-full gap-2 rounded-lg border p-1"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste YouTube playlist link or ID"
                        className="border-none outline-none focus:ring-0"
                    />
                    <Button size="icon" aria-label="Analyze playlist">
                        <ArrowRight />
                    </Button>
                </form>
            </div>
        </main>
    );
}
