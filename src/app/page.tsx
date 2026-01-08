"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAME = "Raunak";

const GREETINGS = [
    "Unlock playlist insights",
    "Discover your next favorite song",
    "Find pure gold together",
    "Turn taste into predictions",
    "Transform playlists into masterpieces",
];

export default function HomePage() {
    const [input, setInput] = useState("");
    const [greeting, setGreeting] = useState("");
    const router = useRouter();

    useEffect(() => {
        const greet = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        setGreeting(`${greet} ${NAME}`);
    }, []);

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
                <form onSubmit={handleSubmit} className="w-full flex gap-2 border rounded-lg p-1">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste youtube playlist link or ID"
                        className="outline-none border-none focus:outline-none focus:ring-0 focus:ring-transparent"
                    />
                    <Button size={"icon"}><ArrowRight /></Button>
                </form>
            </div>
        </main>
    );
}
