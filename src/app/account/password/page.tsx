import { AuthShell } from "@/components/auth-shell";
import { requireLoggedIn } from "@/lib/auth/guard";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage({ searchParams }: PageProps<"/account/password">) {
  const user = await requireLoggedIn();
  const { first } = await searchParams;
  return (
    <AuthShell title={first || user.mustChangePassword ? "Choose your own password" : "Change password"}>
      {(first || user.mustChangePassword) && (
        <p className="text-sm text-muted">You&apos;re using a temporary password. Choose a new one to continue.</p>
      )}
      <ChangePasswordForm />
    </AuthShell>
  );
}
