"use client";

import { memo } from "react";
import { Bot } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MessageActions } from "./MessageActions";
import type { ChatMessage } from "@/types/predai";

type AssistantMessageProps = {
    message: ChatMessage;
    isStreaming?: boolean;
};

function AssistantMessageComponent({ message, isStreaming }: AssistantMessageProps) {
    return (
        <div className="group/msg flex max-w-[85%] gap-2">
            {/* Avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none border border-border bg-muted">
                <Bot className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="rounded-none border border-border bg-background p-3">
                    <MarkdownRenderer content={message.content} variant="assistant" />
                    {isStreaming && (
                        <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-none bg-primary" />
                    )}
                </div>
                {!isStreaming && (
                    <MessageActions
                        content={message.content}
                        timestamp={message.createdAt}
                    />
                )}
            </div>
        </div>
    );
}

export const AssistantMessage = memo(AssistantMessageComponent);
