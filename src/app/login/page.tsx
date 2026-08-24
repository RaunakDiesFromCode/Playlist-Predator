"use client";

import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeClosed } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const redirectUrl = searchParams.get("redirect") || "/";

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form = new FormData(e.currentTarget);
        const email = form.get("email") as string;
        const password = form.get("password") as string;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        router.replace(redirectUrl);
    }

    return (
        <AuthCard title="Welcome back">
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="login-email" className="sr-only">
                        Email
                    </Label>
                    <Input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Email"
                        required
                    />
                </div>

                <div className="relative">
                    <Label htmlFor="login-password" className="sr-only">
                        Password
                    </Label>
                    <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Password"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <Eye /> : <EyeClosed />}
                    </button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="text-right text-sm">
                    <Link href="/forgot-password" className="underline">
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                    Don’t have an account?{" "}
                    <Link
                        href={
                            redirectUrl !== "/"
                                ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                                : "/register"
                        }
                        className="underline"
                    >
                        Register
                    </Link>
                </p>
            </form>
        </AuthCard>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
