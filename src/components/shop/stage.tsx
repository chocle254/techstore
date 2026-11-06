"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type StagePhoto = { src: string; alt: string; width: number; height: number };

/**
 * The half of the page that stays still. It shows the photograph that belongs to the section
 * being read: sections mark themselves with data-stage="<group>:<index>".
 */
export function Stage({ group, photos, bar, priority }: { group: string; photos: StagePhoto[]; bar: React.ReactNode; priority?: boolean }) {
  const [on, setOn] = useState(0);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(`[data-stage^="${group}:"]`);
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setOn(Number((e.target as HTMLElement).dataset.stage!.split(":")[1]) || 0);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [group]);

  return (
    <div className="jw-stage relative h-full w-full overflow-hidden bg-jw-ink">
      {photos.map((p, i) => (
        <Image
          key={p.src}
          src={p.src}
          alt={i === on ? p.alt : ""}
          aria-hidden={i === on ? undefined : true}
          fill
          priority={priority && i === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          data-on={i === on ? "true" : "false"}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-jw-ground px-4 py-2 text-[0.9375rem]">
        {bar}
      </div>
    </div>
  );
}
