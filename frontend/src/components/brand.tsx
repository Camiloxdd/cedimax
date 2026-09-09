export function Wordmark({ size = "text-xl", className }: { size?: string; className?: string }) {
  return (
    <span className={`${size} font-bold tracking-tight${className ? ` ${className}` : ""}`}>
      <span className="text-brand-600">CEDI</span>
      <span className="text-coral-500">MAX</span>
      <span className="ml-0.5 text-[0.55em] align-middle text-coral-400">◆</span>
    </span>
  );
}

export function PulseLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" fill="none" aria-hidden="true" className={`h-6 w-full${className ? ` ${className}` : ""}`}>
      <path
        d="M2 12h22l6-8 8 16 6-8h16l6-6 4 14 6-8h36"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}