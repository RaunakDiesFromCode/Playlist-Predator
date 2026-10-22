"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
    variant?: "dropdown" | "button";
    className?: string;
};

const ThemeToggle = ({ variant = "dropdown", className }: ThemeToggleProps) => {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        if (variant === "button") {
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle theme"
                    className="h-10 w-10 text-muted-foreground opacity-50"
                    disabled
                >
                    <Sun className="h-4 w-4" />
                </Button>
            );
        }
        return null;
    }

    const currentTheme = theme === "system" ? systemTheme : theme;
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    const label = currentTheme === "dark" ? "Light" : "Dark";

    const toggleTheme = () => setTheme(nextTheme);

    if (variant === "button") {
        return (
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={`Switch to ${nextTheme} theme`}
                className={className ?? "h-10 w-10 text-muted-foreground hover:text-foreground"}
            >
                {currentTheme === "dark" ? (
                    <Sun className="h-4 w-4" />
                ) : (
                    <Moon className="h-4 w-4" />
                )}
            </Button>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={toggleTheme}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTheme();
                }
            }}
            aria-label={`Switch to ${nextTheme} theme`}
            className="flex w-full cursor-pointer items-center gap-2"
        >
            {currentTheme === "dark" ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
            <span>{label}</span>
        </div>
    );
};

export default ThemeToggle;
