import { ShopFooter, ShopHeader } from "./chrome";

export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";

export function contactLine() {
  return CONTACT ? `call or WhatsApp us on ${CONTACT}` : "call or WhatsApp us on the number we used to confirm your order";
}

/** A policy page: title, date, then sections of plain text in one readable column. */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, React.ReactNode][] }) {
  return (
    <>
      <ShopHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 pt-6 sm:px-4">
        <div className="jw-clay p-6 sm:p-10">
          <h1 className="text-[length:var(--step-head)]">{title}</h1>
          <p className="mt-2 text-sm text-jw-soft">Last updated {updated}</p>
          {sections.map(([h, body]) => (
            <section key={h} className="mt-8">
              <h2 className="text-lg">{h}</h2>
              <div className="mt-2 space-y-3 text-jw-ink/85">{body}</div>
            </section>
          ))}
        </div>
      </main>
      <ShopFooter />
    </>
  );
}
