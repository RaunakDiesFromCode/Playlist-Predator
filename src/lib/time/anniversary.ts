/**
 * Utilities for Playlist Predator's anniversary celebration.
 * Created on 1st January 2026.
 * Every year on 1st January (IST), turns border and button colors to gold
 * and displays an anniversary indicator.
 */

// Set to true to show the golden colors and anniversary banner now for testing.
// Switch to false so it activates strictly on 1st January (IST).
export const FORCE_ANNIVERSARY_TEST = false;

/**
 * Checks if the specified date (defaulting to now) is January 1st in Indian Standard Time (IST).
 */
export function isAnniversaryDateIST(date: Date = new Date()): boolean {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        month: "numeric",
        day: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return month === "1" && day === "1";
}

/**
 * Calculates how many years Playlist Predator turns today (current year - 2026).
 * In IST timezone. Defaults to at least 1 when testing in 2026.
 */
export function getAnniversaryAgeIST(date: Date = new Date()): number {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const yearStr = parts.find((p) => p.type === "year")?.value;
    const currentYear = yearStr ? parseInt(yearStr, 10) : date.getFullYear();
    const diff = currentYear - 2026;
    return diff > 0 ? diff : 1;
}

/**
 * Determines whether the anniversary mode is currently active.
 * - Supports URL override: ?anniversary=true or ?anniversary=false
 * - Falls back to FORCE_ANNIVERSARY_TEST if enabled
 * - Falls back to whether today is 1st January in IST
 */
export function isAnniversaryActive(): boolean {
    if (typeof window !== "undefined") {
        try {
            const params = new URLSearchParams(window.location.search);
            const override = params.get("anniversary");
            if (override === "true") return true;
            if (override === "false") return false;
        } catch {
            // Ignore searchParams access issues
        }
    }
    if (FORCE_ANNIVERSARY_TEST) {
        return true;
    }
    return isAnniversaryDateIST();
}

/**
 * Returns the celebratory anniversary text for the home page.
 */
export function getAnniversaryMessage(age?: number): string {
    const resolvedAge = age ?? getAnniversaryAgeIST();
    const unit = resolvedAge === 1 ? "year" : "years";
    return `Playlist predator turns ${resolvedAge} ${unit} today`;
}
