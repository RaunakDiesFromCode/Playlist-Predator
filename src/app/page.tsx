"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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


export default function HomePage() {
    const [input, setInput] = useState("");
    const [greeting, setGreeting] = useState("");
    const router = useRouter();

    const { user, loading } = useAuth();

    useEffect(() => {
        // pick greeting once per auth change
        const greet = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

        if (!loading && user?.name) {
            setGreeting(`${greet}, ${user.name}`);
        } else {
            setGreeting(greet);
        }
    }, [user, loading]);

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
            <div className="w-full max-w-xl flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-center">{greeting}</h1>

                <form
                    onSubmit={handleSubmit}
                    className="w-full flex gap-2 border rounded-lg p-1"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste youtube playlist link or ID"
                        className="outline-none border-none focus:ring-0"
                    />
                    <Button size="icon">
                        <ArrowRight />
                    </Button>
                </form>
            </div>
        </main>
    );
}
