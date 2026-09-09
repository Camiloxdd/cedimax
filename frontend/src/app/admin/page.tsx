"use client";

import * as React from "react";
import { apiFetch, getAdminKey, setAdminKey } from "@/lib/api";
import { Badge, Button, Card, Input, Spinner, cx, statusBadge } from "@/components/ui";
import { Wordmark } from "@/components/brand";
import type { Appointment, Service, Stats } from "@/lib/types";
import { AppointmentsView } from "./_components/appointments";
import { CalendarView } from "./_components/calendar";
import { ChatsView } from "./_components/conversations";
import { ExceptionsView, HoursView } from "./_components/settings";
import { ServicesView } from "./_components/services";

export default function AdminPage() {
  const [authed, setAuthed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return getAdminKey() !== "";
  });

  if (!authed) {
    return <AuthScreen onOk={() => setAuthed(true)} />;
  }

  return (
    <main className="flex-1 bg-slate-50">
      <AdminApp onLogout={() => setAuthed(false)} />
    </main>
  );
}

function AuthScreen({ onOk }: { onOk: () => void }) {
  const [key, setKey] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function tryAuth() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<{ data: Stats }>("/api/admin/stats", {}, true);
      setAdminKey(key.trim());
      onOk();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-2 flex justify-center"><Wordmark size="text-2xl" /></div>
        <h1 className="text-center text-lg font-semibold text-slate-900">Panel de administración</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Ingresa la clave de administración.</p>
        <div className="mt-5 space-y-3">
          <Input
            type="password"
            placeholder="Clave de admin"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryAuth()}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" onClick={tryAuth} disabled={loading}>
            {loading ? <Spinner /> : "Entrar"}
          </Button>
        </div>
      </Card>
    </main>
  );
}

function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = React.useState("stats");
  const [services, setServices] = React.useState<Service[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const tabs = [
    { id: "stats", label: "Resumen" },
    { id: "calendar", label: "Calendario" },
    { id: "appointments", label: "Citas" },
    { id: "services", label: "Servicios" },
    { id: "hours", label: "Horarios" },
    { id: "exceptions", label: "Excepciones" },
    { id: "chats", label: "Conversaciones" },
  ];

  React.useEffect(() => {
    apiFetch<{ data: Service[] }>("/api/admin/services", {}, true)
      .then((r) => setServices(r.data))
      .catch(() => {});
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Panel de CEDIMAX</h1>
          <p className="text-sm text-slate-500">Centro de Imágenes Diagnósticas · gestiona tus reservas y conversaciones.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={refresh}>Actualizar</Button>
          <Button variant="ghost" onClick={onLogout}>Salir</Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsView refreshKey={refreshKey} />}
      {tab === "calendar" && <CalendarView onChanged={refresh} />}
      {tab === "appointments" && <AppointmentsView onChanged={refresh} />}
      {tab === "services" && <ServicesView services={services} onChanged={refresh} />}
      {tab === "hours" && <HoursView />}
      {tab === "exceptions" && <ExceptionsView />}
      {tab === "chats" && <ChatsView />}
    </div>
  );
}

function StatsView({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<{ data: Stats }>("/api/admin/stats", {}, true)
      .then((r) => setStats(r.data))
      .catch((e) => setError((e as Error).message));
  }, [refreshKey]);

  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!stats) return <p className="text-sm text-slate-400">Cargando resumen…</p>;

  const cards = [
    { label: "Citas hoy", value: stats.citas_hoy },
    { label: "Confirmadas", value: stats.confirmadas_hoy },
    { label: "Realizadas", value: stats.completadas_hoy },
    { label: "Canceladas", value: stats.canceladas_hoy },
    { label: "Enlaces pendientes", value: stats.enlaces_pendientes },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="text-3xl font-extrabold text-brand-700">{c.value}</div>
            <div className="mt-1 text-sm font-medium text-slate-500">{c.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-slate-900">Próximas citas</h3>
        {stats.proximas.length === 0 && <p className="text-sm text-slate-400">No hay citas confirmadas próximas.</p>}
        <div className="divide-y divide-slate-100">
          {stats.proximas.map((a: Appointment) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">{a.contact.name} · {a.service.name}</div>
                <div className="text-xs text-slate-500">{a.date} · {a.time} ({a.duration_minutes} min) · ${a.price}</div>
              </div>
              <Badge kind={statusBadge(a.status).kind}>{statusBadge(a.status).label}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}