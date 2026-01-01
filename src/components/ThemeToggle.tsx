"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";

const ThemeToggle = () => {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    return (
        <Button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            size={"icon"}
            aria-label="Toggle theme"
        >
            {currentTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
    );
};

export default ThemeToggle;
