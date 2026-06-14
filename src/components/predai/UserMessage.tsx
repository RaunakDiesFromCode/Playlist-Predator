"use client";

import { memo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { ChatMessage } from "@/types/predai";

type UserMessageProps = {
    message: ChatMessage;
};

const COLLAPSE_THRESHOLD = 200; // pixels

function UserMessageComponent({ message }: UserMessageProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Check if content overflows after mount
    if (contentRef.current && !isOverflowing) {
        if (contentRef.current.scrollHeight > COLLAPSE_THRESHOLD) {
            setIsOverflowing(true);
        }
    }

    const shouldCollapse = isOverflowing && !isExpanded;

    return (
        <div className="ml-auto flex max-w-[85%] flex-col items-end gap-1">
            <div
                className={`w-fit rounded-none bg-primary p-3 text-primary-foreground transition-all ${
                    shouldCollapse ? "max-h-[200px] overflow-hidden" : ""
                }`}
                ref={contentRef}
            >
                {shouldCollapse && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-8 h-8" />
                )}
                <MarkdownRenderer content={message.content} variant="user" />
            </div>

            {isOverflowing && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 rounded-none px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={isExpanded ? "Show less" : "Show more"}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-3 w-3" />
                            Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3" />
                            Show more
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export const UserMessage = memo(UserMessageComponent);
