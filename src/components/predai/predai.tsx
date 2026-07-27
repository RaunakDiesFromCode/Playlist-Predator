"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { ScrollToBottom } from "./ScrollToBottom";
import type { ChatMessage } from "@/types/predai";
import type { PlaylistAnalysisResponse } from "@/types/playlist";
import type { PlaylistProgress } from "@/types/progress";

type PredAIProps = {
    playlistId: string;
    initialData?: PlaylistAnalysisResponse | null;
    initialProgress?: PlaylistProgress;
};

// ── History Loading Skeleton ────────────────────────────────────────────────

function HistoryLoadingSkeleton() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-4 p-4">
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-2/3 rounded-none" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-none" />
                    <Skeleton className="h-16 w-3/4 rounded-none" />
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-8 w-1/2 rounded-none" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-none" />
                    <Skeleton className="h-20 w-2/3 rounded-none" />
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-12 w-1/3 rounded-none" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-none" />
                    <Skeleton className="h-14 w-3/5 rounded-none" />
                </div>
            </div>
            <div className="border-t border-border bg-background p-3">
                <div className="mx-auto flex max-w-4xl gap-2">
                    <Skeleton className="h-10 flex-1 rounded-none" />
                    <Skeleton className="h-10 w-10 rounded-none" />
                </div>
            </div>
        </div>
    );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-none border border-border bg-muted">
                    <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold">PredAI</h1>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Your playlist-aware study assistant. Ask about videos,
                    topics, or what to study next.
                </p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground/40">
                    PredAI is a free AI assistant and might face rate limits or
                    downtime. If you encounter issues, please try again later.
                    For best results, ask questions related to the
                    playlist&apos;s content. PredAI may not answer questions
                    unrelated to the playlist.
                </p>
            </div>
        </div>
    );
}

// ── Main PredAI Component ───────────────────────────────────────────────────

const PredAI = ({ playlistId, initialData, initialProgress }: PredAIProps) => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);

    // ── Load conversation history ─────────────────────────────────────────
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

    // ── Smart scroll: only auto-scroll when near bottom ────────────────────
    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = "smooth") => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        },
        [],
    );

    useEffect(() => {
        if (isNearBottomRef.current) {
            scrollToBottom();
        }
    }, [messages, isLoading, scrollToBottom]);

    // ── Track scroll position to show/hide scroll-to-bottom button ─────────
    const handleScroll = useCallback(() => {
        const el = scrollAreaRef.current;
        if (!el) return;

        // Find the viewport element inside ScrollArea
        const viewport = el.querySelector("[data-radix-scroll-area-viewport]");
        if (!viewport) return;

        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        isNearBottomRef.current = distanceFromBottom < 100;
        setShowScrollButton(distanceFromBottom > 300);
    }, []);

    // ── Send message ───────────────────────────────────────────────────────
    const handleSend = useCallback(async () => {
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

        // Persist user message if conversation exists
        if (conversationId) {
            fetch("/api/predai/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId,
                    role: "user",
                    content: userMessage.content,
                }),
            }).catch(console.error);
        }

        setMessage("");
        setIsLoading(true);
        isNearBottomRef.current = true;

        try {
            const response = await fetch("/api/predai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    playlistId,
                    initialData,
                    initialProgress,
                }),
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => null);
                const msg = errBody?.error || response.statusText;
                throw new Error(msg || "Failed to generate response");
            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";
            let sseBuffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                sseBuffer += decoder.decode(value, { stream: true });
                const lines = sseBuffer.split("\n");
                sseBuffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6);
                    if (data === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(data);
                        const token = parsed.choices?.[0]?.delta?.content ?? "";
                        if (!token) continue;

                        accumulated += token;

                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantId
                                    ? { ...msg, content: accumulated }
                                    : msg,
                            ),
                        );
                    } catch {
                        // Ignore malformed SSE chunks
                    }
                }
            }

            // Persist assistant response
            if (conversationId && accumulated.trim()) {
                fetch("/api/predai/message", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversationId,
                        role: "assistant",
                        content: accumulated,
                    }),
                }).catch(console.error);
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
    }, [
        message,
        isLoading,
        conversationId,
        messages,
        playlistId,
        initialData,
        initialProgress,
    ]);

    // ── Loading state ──────────────────────────────────────────────────────
    if (historyLoading) {
        return <HistoryLoadingSkeleton />;
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Messages area */}
            <ScrollArea
                className="flex-1"
                ref={scrollAreaRef}
                onScrollCapture={handleScroll}
            >
                {messages.length === 0 && !isLoading ? (
                    <EmptyState />
                ) : (
                    <div className="relative mx-auto max-w-4xl space-y-4 p-4">
                        {messages.map((msg, index) => {
                            const isLast = index === messages.length - 1;
                            const isStreaming =
                                isLast &&
                                msg.role === "assistant" &&
                                isLoading &&
                                msg.content !== "";

                            if (msg.role === "user") {
                                return (
                                    <UserMessage key={msg.id} message={msg} />
                                );
                            }

                            return (
                                <AssistantMessage
                                    key={msg.id}
                                    message={msg}
                                    isStreaming={isStreaming}
                                />
                            );
                        })}

                        {/* Typing indicator when waiting for first token */}
                        {isLoading &&
                            messages[messages.length - 1]?.content === "" && (
                                <TypingIndicator />
                            )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                <ScrollToBottom
                    onClick={() => scrollToBottom()}
                    visible={showScrollButton}
                />
            </ScrollArea>

            {/* Input area */}
            <ChatInput
                value={message}
                onChange={setMessage}
                onSend={handleSend}
                isLoading={isLoading}
                disabled={!conversationId}
            />
        </div>
    );
};

export default PredAI;
