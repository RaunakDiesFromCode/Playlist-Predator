"use client";

import { useTheme } from "@/context/theme-context";
import { Sun, Moon } from "lucide-react";
const ThemeToggle = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme}>
            {isDarkMode ? (
                <Sun className="text-gray-600 dark:text-white" size={24} />
            ) : (
                <Moon className="text-gray-600 dark:text-white" size={24} />
            )}
        </button>
    );
};

export default ThemeToggle;
