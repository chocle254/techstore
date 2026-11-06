"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction, type ShopState } from "../../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="jw-btn w-full">
      {pending ? "Creating your account…" : "Create account"}
    </button>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [state, action] = useActionState<ShopState, FormData>(signupAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="jw-label">Name</span>
        <input name="name" required maxLength={80} autoComplete="name" className="jw-input" />
      </label>
      <label className="block">
        <span className="jw-label">Phone number</span>
        <input name="phone" required inputMode="tel" autoComplete="tel" maxLength={20} placeholder="0712 345 678" className="jw-input" />
      </label>
      <label className="block">
        <span className="jw-label">Password</span>
        <input name="password" type="password" required autoComplete="new-password" aria-describedby="su-pw" className="jw-input" />
        <span id="su-pw" className="mt-1 block text-[length:var(--step-small)] text-jw-soft">
          At least 8 characters.
        </span>
      </label>
      <label className="block">
        <span className="jw-label">Email (optional)</span>
        <input name="email" type="email" maxLength={120} autoComplete="email" aria-describedby="su-em" className="jw-input" />
        <span id="su-em" className="mt-1 block text-[length:var(--step-small)] text-jw-soft">
          Only used to reset your password.
        </span>
      </label>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
