"use client";

import Link from "next/link";
import { use, useActionState } from "react";
import { resetPasswordAction } from "@/lib/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <AuthShell title="Choose a new password">
      {state?.ok ? (
        <>
          <FormMessage state={state} />
          <Link href="/login" className="btn-primary w-full">
            Log in
          </Link>
        </>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <Field label="New password" name="next" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
          <Field label="Type it again" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          <FormMessage state={state} />
          <SubmitButton>Save password</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
