"use client";

import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScrollToBottomProps = {
    onClick: () => void;
    visible: boolean;
};

function ScrollToBottomComponent({ onClick, visible }: ScrollToBottomProps) {
    if (!visible) return null;

    return (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
            <Button
                size="icon"
                variant="outline"
                onClick={onClick}
                className="h-8 w-8 rounded-full border-border bg-background shadow-md transition-all hover:bg-accent"
                aria-label="Scroll to bottom"
            >
                <ChevronDown className="h-4 w-4" />
            </Button>
        </div>
    );
}

export const ScrollToBottom = memo(ScrollToBottomComponent);
