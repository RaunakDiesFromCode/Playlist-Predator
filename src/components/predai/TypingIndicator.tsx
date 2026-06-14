"use client";

import { memo } from "react";
import { Bot } from "lucide-react";

function TypingIndicatorComponent() {
    return (
        <div className="group/msg flex max-w-[85%] gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none border border-border bg-muted">
                <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="rounded-none border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-none bg-muted-foreground [animation-delay:0ms]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-none bg-muted-foreground [animation-delay:150ms]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-none bg-muted-foreground [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
}

export const TypingIndicator = memo(TypingIndicatorComponent);
