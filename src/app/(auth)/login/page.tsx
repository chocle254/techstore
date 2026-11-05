import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/guard";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const { next } = await searchParams;
  return (
    <AuthShell title="Log in">
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
