"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card, Input, Select, Spinner } from "@/components/ui";
import type { ExceptionRow, HoursRow } from "@/lib/types";

export function HoursView() {
  const [rows, setRows] = React.useState<HoursRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  function load() {
    apiFetch<{ data: HoursRow[] }>("/api/admin/business-hours", {}, true)
      .then((r) => setRows(r.data))
      .catch((e) => setError((e as Error).message));
  }

  React.useEffect(load, []);

  function update(idx: number, field: string, value: string | boolean) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/admin/business-hours", { method: "PUT", body: JSON.stringify({ data: rows }) }, true);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Horarios</h3>
        <Button onClick={save} disabled={saving}>{saving ? <Spinner /> : "Guardar horarios"}</Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <span className="w-28 font-medium text-slate-700">{DAYS[r.day_of_week]}</span>
            <Input className="w-28" type="time" value={r.open_time} onChange={(e) => update(i, "open_time", e.target.value)} />
            <span className="text-slate-400">a</span>
            <Input className="w-28" type="time" value={r.close_time} onChange={(e) => update(i, "close_time", e.target.value)} />
            <Select className="w-40" value={String(r.slot_interval)} onChange={(e) => update(i, "slot_interval", e.target.value)}>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={r.active} onChange={(e) => update(i, "active", e.target.checked)} />
              Abierto
            </label>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ExceptionsView() {
  const [items, setItems] = React.useState<ExceptionRow[]>([]);
  const [date, setDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function load() {
    apiFetch<{ data: ExceptionRow[] }>("/api/admin/business-exceptions", {}, true)
      .then((r) => setItems(r.data))
      .catch((e) => setError((e as Error).message));
  }

  React.useEffect(load, []);

  async function add() {
    setError(null);
    if (!date) return setError("Elige una fecha.");
    try {
      await apiFetch("/api/admin/business-exceptions", { method: "POST", body: JSON.stringify({ date, reason }) }, true);
      setDate("");
      setReason("");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await apiFetch(`/api/admin/business-exceptions/${id}`, { method: "DELETE" }, true);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="mb-4 font-semibold text-slate-900">Días cerrados / excepciones</h3>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input type="date" className="w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input className="w-64" placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button onClick={add}>Agregar</Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-400">Sin excepciones.</p>}
        {items.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div>
              <div className="text-sm font-medium text-slate-800">{e.date}</div>
              <div className="text-xs text-slate-500">{e.reason || "Sin motivo"}</div>
            </div>
            <button className="text-sm font-semibold text-red-600 hover:underline" onClick={() => remove(e.id)}>Quitar</button>
          </div>
        ))}
      </div>
    </Card>
  );
}