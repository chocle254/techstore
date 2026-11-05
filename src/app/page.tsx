import Link from "next/link";

// Temporary home page. The full shop arrives in stage 3.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-brand-700">
        JonWin <span className="text-ink">Clean</span>
      </h1>
      <p className="text-lg text-muted">Liquid soap, bleach, antiseptic and disinfectant. 500ml to 20 litres.</p>
      <p className="text-muted">Our online shop is coming soon.</p>
      <Link href="/login" className="btn-primary mx-auto">
        Staff log in
      </Link>
    </main>
  );
}
