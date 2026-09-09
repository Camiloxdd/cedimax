"use client";

import * as React from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-slate-900 text-white hover:bg-slate-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500",
        props.className,
      )}
    />
  );
}

export function Badge({ kind = "gray", children }: { kind?: "green" | "red" | "amber" | "gray" | "blue"; children: React.ReactNode }) {
  const map = {
    green: "bg-brand-100 text-brand-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    gray: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-800",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[kind])}>
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-slate-400 hover:text-slate-700" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 align-middle" />
  );
}

export function statusBadge(status: string) {
  const map: Record<string, "green" | "red" | "amber" | "gray" | "blue"> = {
    confirmed: "green",
    cancelled: "red",
    completed: "blue",
    no_show: "amber",
    pending: "amber",
    booked: "green",
  };
  const labels: Record<string, string> = {
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Realizada",
    no_show: "No asistió",
    pending: "Pendiente",
    booked: "Reservada",
  };
  return { kind: map[status] || "gray", label: labels[status] || status };
}