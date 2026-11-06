"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Phone or email" name="identifier" autoComplete="username" required placeholder="0712 345 678" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormMessage state={state} />
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-brand-700 underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
