"use client";

import { useCallback, useRef, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    disabled?: boolean;
    placeholder?: string;
};

const MAX_ROWS = 8;
const LINE_HEIGHT = 21; // approximate line height in px
const MAX_HEIGHT = MAX_ROWS * LINE_HEIGHT;

export function ChatInput({
    value,
    onChange,
    onSend,
    isLoading,
    disabled,
    placeholder = "Ask PredAI about this playlist...",
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize logic
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";

        const scrollHeight = textarea.scrollHeight;
        if (scrollHeight > MAX_HEIGHT) {
            textarea.style.height = `${MAX_HEIGHT}px`;
            textarea.style.overflowY = "auto";
        } else {
            textarea.style.height = `${scrollHeight}px`;
            textarea.style.overflowY = "hidden";
        }
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !isLoading && !disabled) {
                onSend();
            }
        }
    };

    return (
        <div className="border-t border-border bg-background pt-3 px-2 py-1">
            <div className="mx-auto flex max-w-4xl gap-2">
                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading || disabled}
                        rows={1}
                        className="min-h-[40px] w-full resize-none rounded-none border border-input bg-transparent px-3 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            maxHeight: `${MAX_HEIGHT}px`,
                            overflowY: "hidden",
                        }}
                    />
                </div>

                <Button
                    size="icon"
                    onClick={onSend}
                    disabled={!value.trim() || isLoading || disabled}
                    className="h-10 w-10 shrink-0"
                    aria-label={isLoading ? "Sending..." : "Send message"}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
            <div className="mx-20 text-xs text-muted-foreground/50 text-center italic">
                PredAI may not always provide accurate information. Please verify any critical details independently.
            </div>
        </div>
    );
}
