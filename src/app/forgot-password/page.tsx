"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

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

        const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
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
                <Input name="email" type="email" placeholder="Email" required />

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
