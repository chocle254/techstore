import Link from "next/link";

/** Log in, sign up and password pages, in the shop's look. */
export function AuthShell({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[30rem] flex-1 flex-col justify-center px-3 py-10">
      <Link href="/" className="mb-8 text-center text-[length:var(--step-lead)] font-medium tracking-tight">
        JonWin Clean
      </Link>
      <div className="space-y-6 bg-jw-paper px-6 py-10 sm:px-10">
        <h1 className="text-[length:var(--step-head)]">{title}</h1>
        {children}
      </div>
      {aside && <div className="mt-6 px-2 text-center">{aside}</div>}
    </main>
  );
}
