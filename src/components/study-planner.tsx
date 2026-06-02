"use client";

import { useId, useMemo } from "react";
import { useIsMounted } from "@/hooks/use-mounted";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
    calculateCompletionDate,
    calculateDaysRequired,
    calculateSpeedAdjustedMinutes,
    calculateVideosPerDay,
} from "@/lib/planner/planner";
import { cn } from "@/lib/utils";

type StudyPlannerProps = {
    remainingMinutes: number;
    remainingVideos: number;
    studyHours: number;
    studyMinutes: number;
    preferredSpeed: number;
    onStudyTimeChange: (hours: number, minutes: number) => void;
    title?: string;
    className?: string;
};

function formatCompletionDate(date: Date | null) {
    if (!date) {
        return "—";
    }

    return new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(date);
}

function formatVideosPerDay(videosPerDay: number) {
    if (!Number.isFinite(videosPerDay) || videosPerDay <= 0) {
        return "0";
    }

    return Number.isInteger(videosPerDay)
        ? `${videosPerDay}`
        : videosPerDay.toFixed(1);
}

export default function StudyPlanner({
    remainingMinutes,
    remainingVideos,
    studyHours,
    studyMinutes,
    preferredSpeed,
    onStudyTimeChange,
    title = "Study Planner",
    className,
}: StudyPlannerProps) {
    const hoursInputId = useId();
    const minutesInputId = useId();
    const isMounted = useIsMounted();

    const dailyMinutes = studyHours * 60 + studyMinutes;
    const adjustedRemainingMinutes = calculateSpeedAdjustedMinutes(
        remainingMinutes,
        preferredSpeed,
    );

    const planner = useMemo(() => {
        const daysRequired = calculateDaysRequired(
            adjustedRemainingMinutes,
            dailyMinutes,
        );
        const completionDate = calculateCompletionDate(
            adjustedRemainingMinutes,
            dailyMinutes,
        );
        const videosPerDay = calculateVideosPerDay(
            remainingVideos,
            daysRequired,
        );

        return {
            daysRequired,
            completionDate,
            videosPerDay,
        };
    }, [adjustedRemainingMinutes, dailyMinutes, remainingVideos]);

    const hasRemainingWork = remainingMinutes > 0 || remainingVideos > 0;
    const hasValidStudyTime = dailyMinutes > 0;

    return (
        <Card className={cn("border-none md:border", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-end gap-2">
                    <Field className="flex-1">
                        <FieldLabel>Hours</FieldLabel>
                        <Input
                            id={hoursInputId}
                            type="number"
                            min={0}
                            value={studyHours}
                            onChange={(event) =>
                                onStudyTimeChange(
                                    Number(event.target.value),
                                    studyMinutes,
                                )
                            }
                        />
                    </Field>

                    <Field className="flex-1">
                        <FieldLabel>Minutes</FieldLabel>
                        <Input
                            id={minutesInputId}
                            type="number"
                            min={0}
                            value={studyMinutes}
                            onChange={(event) =>
                                onStudyTimeChange(
                                    studyHours,
                                    Number(event.target.value),
                                )
                            }
                        />
                    </Field>

                    <div className="py-2 text-muted-foreground">
                        Preferred Speed: {preferredSpeed}×
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border p-3 text-center">
                        <div className="text-lg font-semibold">
                            {hasRemainingWork
                                ? hasValidStudyTime
                                    ? planner.daysRequired
                                    : "—"
                                : 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Days
                        </div>
                    </div>

                    <div className="rounded-md border p-3 text-center">
                        <div className="text-lg font-semibold">
                            {isMounted
                                ? hasRemainingWork
                                    ? hasValidStudyTime
                                        ? formatCompletionDate(
                                              planner.completionDate,
                                          )
                                        : "—"
                                    : formatCompletionDate(planner.completionDate)
                                : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Finish
                        </div>
                    </div>

                    <div className="rounded-md border p-3 text-center">
                        <div className="text-lg font-semibold">
                            {hasRemainingWork
                                ? hasValidStudyTime
                                    ? formatVideosPerDay(planner.videosPerDay)
                                    : "—"
                                : "0"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Videos/day
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
