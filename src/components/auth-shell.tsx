import Link from "next/link";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-center text-2xl font-bold text-brand-700">
        JonWin <span className="text-ink">Clean</span>
      </Link>
      <div className="card space-y-4 p-6">
        <h1 className="text-xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
