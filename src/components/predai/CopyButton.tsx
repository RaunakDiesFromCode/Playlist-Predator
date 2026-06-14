"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyButtonProps = {
    text: string;
    className?: string;
};

export function CopyButton({ text, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [text]);

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className={`h-7 w-7 transition-all ${className ?? ""}`}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            title={copied ? "Copied!" : "Copy"}
        >
            {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
                <Copy className="h-3.5 w-3.5" />
            )}
        </Button>
    );
}
