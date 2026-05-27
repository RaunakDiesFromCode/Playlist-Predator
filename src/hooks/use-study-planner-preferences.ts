"use client";

import { useEffect, useState } from "react";
import { FASTEST_SANE_SPEEDS } from "@/lib/planner/planner";

export type StudyPlannerPreferences = {
    hours: number;
    minutes: number;
    preferredSpeed: number;
};

const DEFAULT_PREFERENCES: StudyPlannerPreferences = {
    hours: 1,
    minutes: 0,
    preferredSpeed: 1.5,
};

function normalizeHoursMinutes(hours: number, minutes: number) {
    const safeHours = Number.isFinite(hours)
        ? Math.max(0, Math.floor(hours))
        : 0;
    const safeMinutes = Number.isFinite(minutes)
        ? Math.max(0, Math.floor(minutes))
        : 0;

    return {
        hours: safeHours + Math.floor(safeMinutes / 60),
        minutes: safeMinutes % 60,
    };
}

function normalizeSpeed(speed: number) {
    const fallback = DEFAULT_PREFERENCES.preferredSpeed;

    if (!Number.isFinite(speed) || speed <= 0) {
        return fallback;
    }

    const matched = FASTEST_SANE_SPEEDS.find(
        (option) => option.value === speed,
    );
    return matched?.value ?? fallback;
}

function normalizePreferences(
    preferences: Partial<StudyPlannerPreferences> | null | undefined,
): StudyPlannerPreferences {
    const time = normalizeHoursMinutes(
        preferences?.hours ?? DEFAULT_PREFERENCES.hours,
        preferences?.minutes ?? DEFAULT_PREFERENCES.minutes,
    );

    return {
        ...time,
        preferredSpeed: normalizeSpeed(
            preferences?.preferredSpeed ?? DEFAULT_PREFERENCES.preferredSpeed,
        ),
    };
}

function readPreferences(storageKey: string): StudyPlannerPreferences {
    if (typeof window === "undefined") {
        return DEFAULT_PREFERENCES;
    }

    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return DEFAULT_PREFERENCES;
        }

        return normalizePreferences(
            JSON.parse(raw) as Partial<StudyPlannerPreferences>,
        );
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

export function useStudyPlannerPreferences(storageKey: string) {
    const [preferences, setPreferences] =
        useState<StudyPlannerPreferences>(DEFAULT_PREFERENCES);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setPreferences(readPreferences(storageKey));
        setIsHydrated(true);
    }, [storageKey]);

    useEffect(() => {
        if (!isHydrated) {
            return;
        }

        try {
            window.localStorage.setItem(
                storageKey,
                JSON.stringify(preferences),
            );
        } catch {
            // Ignore storage failures and keep the planner functional.
        }
    }, [isHydrated, preferences, storageKey]);

    function setStudyTime(hours: number, minutes: number) {
        setPreferences((current) => ({
            ...current,
            ...normalizeHoursMinutes(hours, minutes),
        }));
    }

    function setPreferredSpeed(preferredSpeed: number) {
        setPreferences((current) => ({
            ...current,
            preferredSpeed: normalizeSpeed(preferredSpeed),
        }));
    }

    return {
        preferences,
        setStudyTime,
        setPreferredSpeed,
        isHydrated,
    };
}

export { DEFAULT_PREFERENCES as DEFAULT_STUDY_PLANNER_PREFERENCES };
