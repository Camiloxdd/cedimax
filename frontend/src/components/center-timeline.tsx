"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type TimelineStep = {
  n: string;
  title: string;
  desc: string;
  icon: ReactNode;
};

const POS = ["left", "center", "right"] as const;
const DELAYS = [280, 120, 280];

export function CenterTimeline({ steps }: { steps: TimelineStep[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("tl-ready");
          io.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="tl relative">
      <div className="tl-line absolute left-1/6 right-1/6 top-8 hidden h-0.5 md:block" aria-hidden />

      <div className="relative grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.n}
            data-pos={POS[i]}
            className="tl-item relative text-center"
            style={{ transitionDelay: `${DELAYS[i]}ms` }}
          >
            {i === 1 && <span className="tl-hub-ring" aria-hidden />}

            <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-coral-500 text-white shadow-lg shadow-brand-500/25">
              {s.icon}
            </div>

            <span className="text-xs font-bold tracking-widest gradient-text">{s.n}</span>
            <h3 className="mt-1.5 text-lg font-bold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}