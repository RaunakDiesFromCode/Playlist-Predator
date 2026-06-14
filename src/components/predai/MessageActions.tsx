"use client";

import { memo } from "react";
import { Copy, Check, Clock } from "lucide-react";
import { useState } from "react";

type MessageActionsProps = {
    content: string;
    timestamp: number;
};

function MessageActionsComponent({ content, timestamp }: MessageActionsProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = content;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formattedTime = new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100 max-sm:opacity-100">
            <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-none px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={copied ? "Copied" : "Copy message"}
                title={copied ? "Copied!" : "Copy"}
            >
                {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                ) : (
                    <Copy className="h-3 w-3" />
                )}
            </button>

            <span className="flex items-center gap-1 rounded-none px-1.5 py-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formattedTime}
            </span>
        </div>
    );
}

export const MessageActions = memo(MessageActionsComponent);
