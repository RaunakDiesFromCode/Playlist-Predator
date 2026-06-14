"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import { ResponsiveTable } from "./ResponsiveTable";

type MarkdownRendererProps = {
    content: string;
    variant?: "user" | "assistant";
};

const createComponents = (variant: "user" | "assistant"): Components => {
    const isUser = variant === "user";

    return {
        // ── Code blocks ──────────────────────────────────────────────────
        code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            return (
                <CodeBlock
                    className={className}
                    inline={isInline}
                    {...(match ? { "data-language": match[1] } : {})}
                >
                    {children}
                </CodeBlock>
            );
        },

        // ── Tables ──────────────────────────────────────────────────────
        table({ children, ...props }) {
            return (
                <ResponsiveTable>
                    <table {...props}>{children}</table>
                </ResponsiveTable>
            );
        },

        // ── Links ────────────────────────────────────────────────────────
        a({ href, children, ...props }) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={`underline underline-offset-2 ${
                        isUser
                            ? "text-primary-foreground decoration-primary-foreground/50 hover:decoration-primary-foreground"
                            : "text-primary decoration-primary/40 hover:decoration-primary"
                    }`}
                    {...props}
                >
                    {children}
                </a>
            );
        },

        // ── Images ───────────────────────────────────────────────────────
        img({ src, alt, ...props }) {
            return (
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full rounded-none"
                    loading="lazy"
                    {...props}
                />
            );
        },

        // ── Headings ─────────────────────────────────────────────────────
        h1({ children, ...props }) {
            return <h1 {...props}>{children}</h1>;
        },
        h2({ children, ...props }) {
            return <h2 {...props}>{children}</h2>;
        },
        h3({ children, ...props }) {
            return <h3 {...props}>{children}</h3>;
        },
        h4({ children, ...props }) {
            return <h4 {...props}>{children}</h4>;
        },

        // ── Blockquotes ──────────────────────────────────────────────────
        blockquote({ children, ...props }) {
            return <blockquote {...props}>{children}</blockquote>;
        },

        // ── Horizontal rules ────────────────────────────────────────────
        hr() {
            return <hr />;
        },

        // ── Task lists ───────────────────────────────────────────────────
        input({ checked, ...props }) {
            return (
                <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="mr-1.5 accent-primary"
                    {...props}
                />
            );
        },
    };
};

export function MarkdownRenderer({ content, variant = "assistant" }: MarkdownRendererProps) {
    return (
        <div
            className={`markdown-body wrap-break-word overflow-wrap-anywhere ${
                variant === "user" ? "prose-invert" : ""
            }`}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={createComponents(variant)}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
