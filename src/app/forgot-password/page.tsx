"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

function getSiteOrigin() {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();

    if (configuredOrigin) {
        return configuredOrigin.replace(/\/$/, "");
    }

    return window.location.origin;
}

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSentTo(null);
        setLoading(true);

        const form = new FormData(e.currentTarget);
        const email = form.get("email") as string;

        const redirectTo = `${getSiteOrigin()}/auth/callback?next=/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        setSentTo(email);
    }

    return (
        <AuthCard title="Reset your password">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="forgot-password-email" className="sr-only">
                        Email
                    </Label>
                    <Input
                        id="forgot-password-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Email"
                        required
                    />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                {sentTo && (
                    <p className="text-sm text-emerald-600">
                        If an account exists for {sentTo}, a reset link has been
                        sent.
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending reset link..." : "Send reset link"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                    Remembered it?{" "}
                    <Link href="/login" className="underline">
                        Back to login
                    </Link>
                </p>
            </form>
        </AuthCard>
    );
}
