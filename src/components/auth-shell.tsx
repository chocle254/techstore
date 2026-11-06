import { Logo } from "@/components/shop/chrome";

/** Log in, sign up and password pages, in the shop's look. */
export function AuthShell({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[28rem] flex-1 flex-col justify-center px-3 py-10 pb-28 md:pb-10">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>
      <div className="jw-clay space-y-5 p-6 sm:p-9">
        <h1 className="text-2xl">{title}</h1>
        {children}
      </div>
      {aside && <div className="mt-5 px-2 text-center text-sm">{aside}</div>}
    </main>
  );
}
