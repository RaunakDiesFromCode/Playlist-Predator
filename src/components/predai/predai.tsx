"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import type { ChatMessage } from "@/types/predai";

const PredAI = () => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

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

    return (
        <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
                {messages.length === 0 ? (
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
                        disabled={!message.trim() || isLoading}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PredAI;
