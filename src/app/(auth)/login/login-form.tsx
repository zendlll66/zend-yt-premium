"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/features/auth/auth.actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [state, formAction, isPending] = useActionState(
    loginAction,
    {} as { error?: string }
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">Admin Login</h1>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="from" value={from} />
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              required
              disabled={isPending}
              className="w-full"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isPending}
              className="w-full"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </Button>
        </form>
      </div>
    </div>
  );
}
