"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Card, Modal, Spinner, cx, statusBadge } from "@/components/ui";
import type { CalItem } from "@/lib/types";
import { AppointmentDetail } from "./appointments";

export function CalendarView({ onChanged }: { onChanged: () => void }) {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());
  const [days, setDays] = React.useState<Record<string, CalItem[]>>({});
  const [selected, setSelected] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<CalItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  function load() {
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to = new Date(year, month + 1, 0);
    const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(to.getDate()).padStart(2, "0")}`;
    apiFetch<{ data: Record<string, CalItem[]> }>(
      `/api/admin/calendar?from=${from}&to=${toStr}`,
      {},
      true,
    )
      .then((r) => setDays(r.data))
      .catch(() => setDays({}))
      .finally(() => setLoading(false));
  }

  React.useEffect(load, [year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setMonth((m) => (m === 0 ? (setYear((y) => y - 1), 11) : m - 1))}>←</Button>
        <h3 className="font-semibold text-slate-900">{MONTHS[month]} {year}</h3>
        <Button variant="ghost" onClick={() => setMonth((m) => (m === 11 ? (setYear((y) => y + 1), 0) : m + 1))}>→</Button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400"><Spinner /> Cargando calendario…</p>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
            <div key={d} className="py-1 text-center text-xs font-semibold text-slate-400">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={"e" + i} />;
            const str = dateStr(day);
            const items = days[str] || [];
            const isToday = str === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            return (
              <button
                key={str}
                onClick={() => {
                  setSelected(str);
                  setDetail(null);
                }}
                className={cx(
                  "min-h-[72px] rounded-lg border p-1 text-left align-top transition-colors",
                  isToday ? "border-brand-400 bg-brand-50" : "border-slate-100 hover:border-brand-300",
                  selected === str && "ring-2 ring-brand-500",
                )}
              >
                <div className="px-1 text-xs font-bold text-slate-600">{day}</div>
                {items.slice(0, 3).map((a) => (
                  <div key={a.id} className="mx-0.5 mb-0.5 truncate rounded bg-brand-100 px-1 py-0.5 text-[10px] font-medium text-brand-800">
                    {a.time} {a.contact.split(" ")[0]}
                  </div>
                ))}
                {items.length > 3 && <div className="px-1 text-[10px] text-slate-400">+{items.length - 3}</div>}
              </button>
            );
          })}
        </div>
      )}

      <DayModal
        date={selected}
        items={selected ? days[selected] || [] : []}
        detail={detail}
        onPick={setDetail}
        onClose={() => {
          setSelected(null);
          setDetail(null);
        }}
        onChanged={onChanged}
      />
    </Card>
  );
}

export function DayModal({
  date,
  items,
  detail,
  onPick,
  onClose,
  onChanged,
}: {
  date: string | null;
  items: CalItem[];
  detail: CalItem | null;
  onPick: (item: CalItem | null) => void;
  onClose: () => void;
  onChanged: () => void;
}) {
  if (!date) return null;

  return (
    <Modal open={!!date} onClose={onClose} title={`Citas del ${date}`}>
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {items.length === 0 && <p className="text-sm text-slate-400">Sin citas este día.</p>}
        {items.map((a) => (
          <button
            key={a.id}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
            onClick={() => onPick(a)}
          >
            <div>
              <div className="text-sm font-semibold text-slate-800">{a.time} · {a.contact}</div>
              <div className="text-xs text-slate-500">{a.service}</div>
            </div>
            <Badge kind={statusBadge(a.status).kind}>{statusBadge(a.status).label}</Badge>
          </button>
        ))}
      </div>
      {detail && (
        <AppointmentDetail
          appointmentId={detail.id}
          onClose={() => onPick(null)}
          onChanged={onChanged}
        />
      )}
    </Modal>
  );
}