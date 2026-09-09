"use client";

import { useState, useEffect, useCallback } from "react";
import { whatsappLink } from "@/lib/config";
import { Wordmark } from "@/components/brand";
import {
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const NAV_LINKS = [
  { id: "estudios", label: "Estudios" },
  { id: "horario", label: "Horario" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "donde-estamos", label: "Ubicacion" },
] as const;

export function Navbar() {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);

    const offsets = NAV_LINKS.map((link) => {
      const el = document.getElementById(link.id);
      if (!el) return { id: link.id, top: Infinity };
      return { id: link.id, top: el.getBoundingClientRect().top };
    });

    const current = offsets.reduce((closest, item) => {
      if (item.top <= 120 && item.top > closest.top) return item;
      return closest;
    }, { id: "", top: -Infinity });

    if (current.id) setActive(current.id);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    const id = requestAnimationFrame(handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(id);
    };
  }, [handleScroll]);

  return (
    <nav className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl">
      <div className={`rounded-2xl px-4 py-3 sm:px-6 transition-all duration-500 border ${
        scrolled
          ? "bg-white border-slate-200/60 shadow-lg shadow-black/5"
          : "bg-transparent border-transparent"
      }`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Wordmark size="text-xl" />

          {/* Nav links - desktop */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                  active === link.id
                    ? "bg-brand-100 text-brand-700"
                    : "text-slate-600 hover:text-brand-600"
                }`}
              >
                {link.label}
                {active === link.id && (
                  <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />
                )}
              </a>
            ))}
          </div>

          {/* Right side - social + CTA */}
          <div className="flex items-center gap-2">
            {/* Social icons */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-pink-600"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
              aria-label="Facebook"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>

            {/* Divider */}
            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

            {/* WhatsApp CTA */}
            <a
              href={whatsappLink("Hola CEDIMAX, quiero agendar una cita")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md sm:inline-flex"
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
              Reservar
            </a>

            {/* Mobile menu button */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              aria-label="Menu"
              onClick={() => {
                const menu = document.getElementById("mobile-menu");
                menu?.classList.toggle("hidden");
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div id="mobile-menu" className="hidden border-t border-slate-200/50 pt-3 pb-1 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active === link.id
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => document.getElementById("mobile-menu")?.classList.add("hidden")}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    active === link.id ? "bg-brand-500" : "bg-transparent"
                  }`}
                />
                {link.label}
              </a>
            ))}
            <a
              href={whatsappLink("Hola CEDIMAX, quiero agendar una cita")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
              Reservar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
