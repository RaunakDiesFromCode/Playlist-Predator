"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { Eye, EyeClosed } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSaving(true);

        const form = new FormData(e.currentTarget);
        const password = form.get("password") as string;
        const confirmPassword = form.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setSaving(false);
            setError("Passwords do not match");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password,
        });

        setSaving(false);

        if (error) {
            setError(error.message);
            return;
        }

        setSuccess("Password updated. Redirecting to login...");
        router.replace("/login");
    }

    return (
        <AuthCard title="Set a new password">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        minLength={8}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <Eye /> : <EyeClosed />}
                    </button>
                </div>

                <div className="relative">
                    <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        minLength={8}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        {showConfirmPassword ? <Eye /> : <EyeClosed />}
                    </button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && (
                    <p className="text-sm text-emerald-600">{success}</p>
                )}

                <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Updating password..." : "Update password"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                    Need a new reset email?{" "}
                    <Link href="/forgot-password" className="underline">
                        Request another link
                    </Link>
                </p>
            </form>
        </AuthCard>
    );
}
