import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  if (await getCurrentUser()) redirect("/account");
  const { next } = await searchParams;
  return (
    <AuthShell
      title="Create an account"
      aside={
        <p>
          Already have one?{" "}
          <Link href="/login" className="jw-link">
            Log in
          </Link>
        </p>
      }
    >
      <p>Follow your orders and see every payment. You can also make your account at checkout.</p>
      <SignupForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
