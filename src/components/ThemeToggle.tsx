"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    return (
        <div
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="flex w-full cursor-pointer items-center gap-2"
        >
            {currentTheme === "dark" ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
            <span>{currentTheme === "dark" ? "Light" : "Dark"}</span>
        </div>
    );
};

export default ThemeToggle;
