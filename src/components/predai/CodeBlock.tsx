"use client";

import { memo, useState } from "react";
import { Check, Copy, FileCode } from "lucide-react";

type CodeBlockProps = {
    className?: string;
    children: React.ReactNode;
    inline?: boolean;
};

function CodeBlockComponent({ className, children, inline }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    // Extract language from className like "language-ts"
    const language = className?.replace(/language-/, "") ?? "";

    const codeString = String(children).replace(/\n$/, "");

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeString);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = codeString;
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

    if (inline) {
        return (
            <code className={className}>
                {children}
            </code>
        );
    }

    return (
        <div className="group/code relative my-3 overflow-hidden rounded-none border border-border bg-muted">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                        {language || "code"}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-none px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                    aria-label={copied ? "Copied" : "Copy code"}
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code content */}
            <div className="overflow-x-auto">
                <pre className="p-3 text-xs leading-relaxed">
                    <code className="block whitespace-pre">{codeString}</code>
                </pre>
            </div>
        </div>
    );
}

export const CodeBlock = memo(CodeBlockComponent);
