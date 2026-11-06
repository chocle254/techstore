"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestResetAction } from "@/lib/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestResetAction, undefined);
  return (
    <AuthShell title="Forgot password">
      <p className="text-sm text-muted">Enter the email on your account and we&apos;ll send you a reset link.</p>
      <form action={action} className="space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <FormMessage state={state} />
        <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
      </form>
      <p className="text-sm text-muted">
        No email on your account? Call or WhatsApp JonWin Clean and we&apos;ll reset it for you.
      </p>
      <Link href="/login" className="block text-center text-sm text-brand-700 underline">
        Back to log in
      </Link>
    </AuthShell>
  );
}
