"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeClosed } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form = new FormData(e.currentTarget);
        const name = form.get("name") as string;
        const email = form.get("email") as string;
        const password = form.get("password") as string;

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        router.replace("/");
    }

    return (
        <AuthCard title="Create an account">
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="register-name" className="sr-only">
                        Name
                    </Label>
                    <Input
                        id="register-name"
                        name="name"
                        placeholder="Name"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="register-email" className="sr-only">
                        Email
                    </Label>
                    <Input
                        id="register-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Email"
                        required
                    />
                </div>

                <div className="relative">
                    <Label htmlFor="register-password" className="sr-only">
                        Password
                    </Label>
                    <Input
                        id="register-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Password"
                        minLength={8}
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

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Register"}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="underline">
                        Login
                    </Link>
                </p>
            </form>
        </AuthCard>
    );
}
