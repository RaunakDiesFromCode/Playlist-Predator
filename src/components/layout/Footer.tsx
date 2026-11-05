import { Chrome, Heart } from "lucide-react";
import Link from "next/link";
import React from "react";

const Footer = () => {
    return (
        <footer className="flex flex-col items-center justify-center w-full md:text-sm py-4">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
                <Link
                    href="https://github.com/RaunakDiesFromCode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                >
                    <span>Made with</span>
                    <span className="scale-100 md:scale-75">
                        <Heart color="red" opacity={0.7} />
                    </span>
                    <span>by Raunak Manna</span>
                </Link>
                <span className="text-muted-foreground/40">•</span>
                <Link
                    href="/docs/extension"
                    className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:underline font-mono"
                >
                    <Chrome className="h-3.5 w-3.5 text-primary" />
                    <span>Chrome Extension Sync</span>
                </Link>
            </div>
            <div className="text-sm md:text-xs text-center opacity-75">
                <div>Motivation by &quot;caps&quot;</div>
                <div>Fueled by &quot;yeah yeah&quot;</div>
            </div>
        </footer>
    );
};

export default Footer;
