import Link from "next/link";
import { Icon } from "./icons";

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="JonWin Clean, home">
      <span
        className="grid h-9 w-9 place-items-center rounded-2xl text-white"
        style={{ background: "linear-gradient(160deg, var(--color-jw-raise), var(--color-jw-deep))", boxShadow: "0 1px 0 rgb(255 255 255 / .35) inset, 0 6px 14px -6px rgb(247 107 21 / .8)" }}
        aria-hidden
      >
        <Icon name="drop" className="h-5 w-5" />
      </span>
      <span className="text-lg leading-none font-extrabold tracking-tight">
        JonWin<span className="text-jw-ground">.</span>
        <span className="block text-[0.625rem] font-semibold tracking-[0.18em] text-jw-soft uppercase">Clean</span>
      </span>
    </Link>
  );
}
