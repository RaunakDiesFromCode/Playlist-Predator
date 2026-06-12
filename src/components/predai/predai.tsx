"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import type { ChatMessage } from "@/types/predai";

type PredAIProps = {
    playlistId: string;
};

function TypingIndicator() {
    return (
        <div className="w-fit rounded-none border p-3">
            <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </div>
        </div>
    );
}

function HistoryLoadingSkeleton() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-4 p-4">
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-2/3 rounded-none" />
                </div>
                <Skeleton className="h-16 w-3/4 rounded-none" />
                <div className="flex justify-end">
                    <Skeleton className="h-8 w-1/2 rounded-none" />
                </div>
                <Skeleton className="h-20 w-2/3 rounded-none" />
                <div className="flex justify-end">
                    <Skeleton className="h-12 w-1/3 rounded-none" />
                </div>
                <Skeleton className="h-14 w-3/5 rounded-none" />
            </div>
            <div className="border-t bg-background p-3">
                <div className="mx-auto flex max-w-4xl gap-2">
                    <Skeleton className="h-10 flex-1 rounded-none" />
                    <Skeleton className="h-10 w-10 rounded-none" />
                </div>
            </div>
        </div>
    );
}

const PredAI = ({ playlistId }: PredAIProps) => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch(
                    `/api/predai/history?playlistId=${playlistId}`,
                );

                if (!response.ok) {
                    throw new Error("Failed to load history");
                }

                const data = await response.json();

                setConversationId(data.conversationId);
                setMessages(data.messages ?? []);
            } catch (error) {
                console.error(error);
            } finally {
                setHistoryLoading(false);
            }
        };

        loadHistory();
    }, [playlistId]);

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: message.trim(),
            createdAt: Date.now(),
        };

        const assistantId = crypto.randomUUID();

        setMessages((prev) => [
            ...prev,
            userMessage,
            {
                id: assistantId,
                role: "assistant",
                content: "",
                createdAt: Date.now(),
            },
        ]);

        if (conversationId) {
            await fetch("/api/predai/message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId,
                    role: "user",
                    content: userMessage.content,
                }),
            });
        }

        setMessage("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/predai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate response");
            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value);

                const lines = chunk
                    .split("\n")
                    .filter((line) => line.startsWith("data: "));

                for (const line of lines) {
                    const data = line.replace("data: ", "");

                    if (data === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(data);

                        const token = parsed.choices?.[0]?.delta?.content ?? "";

                        if (!token) continue;

                        accumulated += token;

                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantId
                                    ? {
                                          ...msg,
                                          content: accumulated,
                                      }
                                    : msg,
                            ),
                        );
                    } catch {
                        // Ignore malformed SSE chunks
                    }
                }
            }

            if (conversationId && accumulated.trim()) {
                await fetch("/api/predai/message", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        conversationId,
                        role: "assistant",
                        content: accumulated,
                    }),
                });
            }
        } catch (error) {
            console.error(error);

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantId
                        ? {
                              ...msg,
                              content:
                                  "Failed to generate response. Please try again.",
                          }
                        : msg,
                ),
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (historyLoading) {
        return <HistoryLoadingSkeleton />;
    }

    return (
        <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
                {messages.length === 0 && !isLoading ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold">PredAI</h1>

                            <p className="mt-2 text-muted-foreground">
                                Personalized study assistant powered by AI.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 p-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={
                                    msg.role === "user"
                                        ? "ml-auto w-fit rounded-none bg-primary p-3 text-primary-foreground"
                                        : "w-fit rounded-none border p-3 whitespace-pre-wrap"
                                }
                            >
                                {msg.content}
                            </div>
                        ))}

                        {isLoading &&
                            messages[messages.length - 1]?.content === "" && (
                                <TypingIndicator />
                            )}

                        <div ref={bottomRef} />
                    </div>
                )}
            </ScrollArea>

            <div className="border-t bg-background p-3">
                <div className="mx-auto flex max-w-4xl gap-2">
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask PredAI..."
                        rows={1}
                        className="min-h-fit resize-none"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={
                            !message.trim() || isLoading || !conversationId
                        }
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PredAI;
