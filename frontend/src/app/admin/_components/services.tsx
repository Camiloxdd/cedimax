"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Card, Input, Modal, Spinner, Textarea } from "@/components/ui";
import type { Service } from "@/lib/types";

export function ServicesView({ services, onChanged }: { services: Service[]; onChanged: () => void }) {
  const [editing, setEditing] = React.useState<Service | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function remove(s: Service) {
    if (!confirm(`¿Eliminar "${s.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/services/${s.id}`, { method: "DELETE" }, true);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Servicios</h3>
        <Button onClick={() => setEditing("new")}>+ Nuevo servicio</Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="py-2 pr-4 font-medium">Nombre</th>
              <th className="py-2 pr-4 font-medium">Duración</th>
              <th className="py-2 pr-4 font-medium">Precio</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s) => (
              <tr key={s.id}>
                <td className="py-2.5 pr-4">
                  <div className="font-medium text-slate-800">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.description}</div>
                </td>
                <td className="py-2.5 pr-4 text-slate-600">{s.duration_minutes} min</td>
                <td className="py-2.5 pr-4 text-slate-700">${s.price}</td>
                <td className="py-2.5 pr-4">{s.active ? <Badge kind="green">Activo</Badge> : <Badge kind="gray">Inactivo</Badge>}</td>
                <td className="py-2.5">
                  <div className="flex gap-3">
                    <button className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setEditing(s)}>Editar</button>
                    <button className="text-sm font-semibold text-red-600 hover:underline" onClick={() => remove(s)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <ServiceForm
          service={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </Card>
  );
}

export function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(service?.name || "");
  const [description, setDescription] = React.useState(service?.description || "");
  const [duration, setDuration] = React.useState(String(service?.duration_minutes || 30));
  const [price, setPrice] = React.useState(service?.price || "");
  const [active, setActive] = React.useState(service?.active ?? true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const body = { name, description, duration_minutes: Number(duration), price: String(price), active };
    try {
      if (service) {
        await apiFetch(`/api/admin/services/${service.id}`, { method: "PATCH", body: JSON.stringify(body) }, true);
      } else {
        await apiFetch("/api/admin/services", { method: "POST", body: JSON.stringify(body) }, true);
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={service ? "Editar servicio" : "Nuevo servicio"}>
      <div className="space-y-3">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Duración (min)</label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Precio ($)</label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Activo
        </label>
        <Button className="w-full" onClick={save} disabled={saving || !name}>
          {saving ? <Spinner /> : "Guardar"}
        </Button>
      </div>
    </Modal>
  );
}