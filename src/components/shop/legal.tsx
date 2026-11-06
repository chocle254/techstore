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
      <main className="mx-3 mt-3 bg-jw-paper px-5 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-[44rem]">
          <h1 className="text-[length:var(--step-head)]">{title}</h1>
          <p className="mt-4 text-jw-soft">Last updated {updated}</p>
          {sections.map(([h, body]) => (
            <section key={h} className="mt-12">
              <h2 className="text-[length:var(--step-lead)]">{h}</h2>
              <div className="mt-4 space-y-4">{body}</div>
            </section>
          ))}
        </div>
      </main>
      <ShopFooter />
    </>
  );
}
