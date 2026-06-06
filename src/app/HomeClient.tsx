"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { parseYouTubeInput } from "@/lib/youtube/input";

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

export default function HomeClient() {
    const [input, setInput] = useState("");
    const [greetingBase, setGreetingBase] = useState(GREETINGS[0]);
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        setGreetingBase(pickGreeting());
    }, []);

    const greeting =
        !loading && user?.name ? `${greetingBase}, ${user.name}` : greetingBase;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const id = parseYouTubeInput(input)?.id;

        if (!id) return;

        router.push(`/${id}`);
    }

    return (
        <main className="flex h-full min-h-0 items-center justify-center px-4 py-4 sm:py-6">
            <div className="flex w-full max-w-xl flex-col gap-4">
                <h1 className="text-center text-2xl font-bold sm:text-3xl">
                    {greeting}
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="flex w-full gap-2 rounded-none border p-1"
                >
                    <Label htmlFor="home-playlist-input" className="sr-only">
                        YouTube playlist or video link
                    </Label>
                    <Input
                        id="home-playlist-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste YouTube playlist or video link"
                        className="border-none outline-none focus:ring-0"
                    />
                    <Button size="icon" aria-label="Analyze playlist or video">
                        <ArrowRight />
                    </Button>
                </form>

                <div className="flex justify-center gap-2 mt-10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="ghost" className="gap-2">
                                    <Link href="/compare">Compare playlists</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Compare up to 4 playlists side by side</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="ghost" className="gap-2">
                                    <Link href="/insights">View Insights</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Track your progress across playlists</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </main>
    );
}
