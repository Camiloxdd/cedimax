export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573016597322";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function formatCOP(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return "$" + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
}