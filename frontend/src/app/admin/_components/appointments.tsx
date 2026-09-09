"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Card, Input, Modal, Select, Spinner, Textarea, statusBadge } from "@/components/ui";
import type { Appointment } from "@/lib/types";

export function AppointmentsView({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = React.useState<Appointment[]>([]);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [detailId, setDetailId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function load() {
    const params = new URLSearchParams({ limit: "200" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiFetch<{ data: Appointment[] }>(`/api/admin/appointments?${params}`, {}, true)
      .then((r) => setItems(r.data))
      .catch((e) => setError((e as Error).message));
  }

  const debounceRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(load, 350);
    return () => window.clearTimeout(debounceRef.current);
  }, [q, status, from, to]);

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="w-48" placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Realizada</option>
          <option value="cancelled">Cancelada</option>
          <option value="no_show">No asistió</option>
        </Select>
        <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="secondary" onClick={load}>Buscar</Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="py-2 pr-4 font-medium">Fecha</th>
              <th className="py-2 pr-4 font-medium">Hora</th>
              <th className="py-2 pr-4 font-medium">Cliente</th>
              <th className="py-2 pr-4 font-medium">Servicio</th>
              <th className="py-2 pr-4 font-medium">Precio</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-slate-400">Sin citas que coincidan.</td></tr>
            )}
            {items.map((a) => (
              <tr key={a.id}>
                <td className="py-2.5 pr-4 text-slate-700">{a.date}</td>
                <td className="py-2.5 pr-4 text-slate-700">{a.time}</td>
                <td className="py-2.5 pr-4">
                  <div className="font-medium text-slate-800">{a.contact.name}</div>
                  <div className="text-xs text-slate-500">{a.contact.phone}</div>
                </td>
                <td className="py-2.5 pr-4 text-slate-600">{a.service.name}</td>
                <td className="py-2.5 pr-4 text-slate-700">${a.price}</td>
                <td className="py-2.5 pr-4"><Badge kind={statusBadge(a.status).kind}>{statusBadge(a.status).label}</Badge></td>
                <td className="py-2.5">
                  <button className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setDetailId(a.id)}>
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailId !== null && (
        <AppointmentDetail
          appointmentId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={() => { onChanged(); load(); }}
        />
      )}
    </Card>
  );
}

export function AppointmentDetail({
  appointmentId,
  onClose,
  onChanged,
}: {
  appointmentId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [appt, setAppt] = React.useState<Appointment | null>(null);
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    apiFetch<{ data: Appointment }>(`/api/admin/appointments/${appointmentId}`, {}, true)
      .then((r) => {
        setAppt(r.data);
        setDate(r.data.date);
        setTime(r.data.time);
        setNotes(r.data.notes || "");
      })
      .catch((e) => setError((e as Error).message));
  }, [appointmentId]);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch<{ data: Appointment }>(`/api/admin/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }, true);
      setAppt(r.data);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!appt) {
    return <Modal open={true} onClose={onClose} title="Cita"><p className="text-sm text-slate-400"><Spinner /> Cargando…</p></Modal>;
  }

  return (
    <Modal open={true} onClose={onClose} title={`Cita #${appt.id}`}>
      <div className="space-y-3 text-sm">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="font-semibold text-slate-900">{appt.contact.name}</div>
          <div className="text-slate-500">{appt.contact.phone}{appt.contact.wa_id ? ` · WA ${appt.contact.wa_id}` : ""}</div>
          <div className="mt-1 text-slate-600">{appt.service.name}</div>
          <div className="mt-2 flex items-center gap-2">
            <Badge kind={statusBadge(appt.status).kind}>{statusBadge(appt.status).label}</Badge>
            <span className="text-xs text-slate-400">{appt.date} · {appt.time} · ${appt.price} · {appt.duration_minutes} min</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={loading} onClick={() => patch({ status: "completed" })}>Marcar realizada</Button>
          <Button variant="ghost" disabled={loading} onClick={() => patch({ status: "no_show" })}>No asistió</Button>
          <Button variant="danger" disabled={loading} onClick={() => patch({ status: "cancelled", cancel_reason: "Cancelada desde el panel" })}>
            Cancelar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block font-medium text-slate-700">Reprogramar fecha</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-medium text-slate-700">Hora</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <Button className="w-full" variant="secondary" disabled={!date || !time || loading} onClick={() => patch({ date, time })}>
          Guardar reprogramación
        </Button>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Notas</label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button className="mt-2 w-full" variant="ghost" disabled={loading} onClick={() => patch({ notes })}>
            Guardar notas
          </Button>
        </div>
      </div>
    </Modal>
  );
}