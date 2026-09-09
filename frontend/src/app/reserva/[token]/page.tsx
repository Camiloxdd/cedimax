"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatCOP, whatsappLink } from "@/lib/config";
import { Button, Card, Input, Spinner, Textarea, cx } from "@/components/ui";

function toSpanishDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(String(dateStr).slice(0, 10) + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", opts);
}

type Service = {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
};

type Session = {
  token: string;
  suggestedService?: string | null;
  serviceId?: number | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  expiresAt?: string;
};

type SlotsResp = { slots: string[] };

type BookingResp = {
  data: {
    service?: { id: number; name: string; durationMinutes: number; price?: string } | null;
    date: string;
    time: string;
    durationMinutes?: number;
    notes?: string | null;
    contact?: { id: number; name: string; phone?: string | null } | null;
  };
};

const STEPS = ["Servicio", "Fecha", "Hora", "Tus datos"];

export default function ReservaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);

  const [session, setSession] = React.useState<Session | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingToken, setLoadingToken] = React.useState(true);

  const [serviceId, setServiceId] = React.useState<number | null>(null);
  const [date, setDate] = React.useState<string>("");
  const [slots, setSlots] = React.useState<string[] | null>(null);
  const [slotLoading, setSlotLoading] = React.useState(false);
  const [time, setTime] = React.useState<string>("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{
    service: string;
    date: string;
    time: string;
    duration: number;
    price: string;
    name: string;
  } | null>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;

  const selectedService = services.find((s) => s.id === serviceId) || null;

  React.useEffect(() => {
    (async () => {
      try {
        const [ses, srv] = await Promise.all([
          apiFetch<{ data: Session }>(`/api/session/${token}`),
          apiFetch<{ data: Service[] }>("/api/services"),
        ]);
        const s = ses.data;
        setSession(s);
        setServices(srv.data);
        const sid =
          (s.serviceId && srv.data.find((x) => x.id === s.serviceId)?.id) ||
          (s.suggestedService &&
            srv.data.find((x) => x.name.toLowerCase() === s.suggestedService!.toLowerCase())?.id) ||
          null;
        setServiceId(sid);
        const pd = s.preferredDate ? s.preferredDate.slice(0, 10) : "";
        setDate(pd && pd >= todayStr ? pd : "");
        setTime(s.preferredTime || "");
        setName(s.customerName || "");
        setPhone((s.customerPhone || "").replace(/\D/g, ""));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoadingToken(false);
      }
    })();
  }, [token, todayStr]);

  React.useEffect(() => {
    if (!serviceId || !date || step !== 2) return;
    let cancelled = false;
    apiFetch<SlotsResp>(`/api/slots?date=${date}&service_id=${serviceId}`)
      .then((r) => {
        if (cancelled) return;
        setSlots(r.slots);
        if (!r.slots.some((sl) => sl === time)) setTime("");
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setSlotLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date, step]);

  async function next() {
    setError(null);
    if (step === 0 && !serviceId) {
      setError("Selecciona un servicio para continuar.");
      return;
    }
    if (step === 1 && !date) {
      setError("Elige una fecha para continuar.");
      return;
    }
    if (step === 2 && !time) {
      setError("Elige una hora para continuar.");
      return;
    }
    if (step === 3) return submit();
    if (step === 1) setSlotLoading(true);
    setStep((s) => s + 1);
  }

  async function submit() {
    if (!serviceId || !date || !time) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<BookingResp>("/api/booking", {
        method: "POST",
        body: JSON.stringify({ token, service_id: serviceId, date, time, name, phone, notes }),
      });
      const a = res.data;
      setResult({
        service: a.service?.name ?? selectedService?.name ?? "",
        date: a.date,
        time: a.time,
        duration: a.service?.durationMinutes ?? a.durationMinutes ?? selectedService?.durationMinutes ?? 0,
        price: a.service?.price ?? selectedService?.price ?? "0",
        name: a.contact?.name ?? name,
      });
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 409) {
        setError(`Ese horario acaba de ser reservado. Elige otro: ${err.message}`);
        setStep(2);
        setTime("");
      } else if (err.status === 422) {
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingToken) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center text-slate-500">
          <Spinner /> Cargando…
        </div>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="text-4xl">😕</div>
          <h1 className="mt-3 text-xl font-bold text-slate-900">No pudimos abrir la reserva</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <a
            href={whatsappLink("Quiero reservar una cita")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            Solicitar un nuevo enlace por WhatsApp →
          </a>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-start justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Reserva tu estudio en CEDIMAX</h1>
          <p className="mt-1 text-sm text-slate-500">
            ¡Hola {session?.customerName || name || ""}! Completa los pasos para agendar tu estudio.
          </p>
        </div>

        {result ? (
          <Card className="p-8 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">¡Cita confirmada!</h2>
            <p className="mt-1 text-sm text-slate-500">Te enviamos la confirmación por chat.</p>
            <div className="mx-auto mt-6 max-w-sm space-y-2 rounded-xl bg-brand-50 p-5 text-left text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Estudio</span><span className="font-semibold text-slate-800">{result.service}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-semibold text-slate-800">{toSpanishDate(result.date, { weekday: "long", day: "numeric", month: "long" })}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Hora</span><span className="font-semibold text-slate-800">{result.time}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Duración</span><span className="font-semibold text-slate-800">{result.duration} min</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tarifa</span><span className="font-semibold text-brand-700">{formatCOP(result.price)}</span></div>
            </div>
            <a
              href={whatsappLink(`Hola CEDIMAX, soy ${result.name}. Quiero confirmar mi cita del ${toSpanishDate(result.date)} a las ${result.time}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Confirmar por WhatsApp
            </a>
            <Link href="/" className="mt-4 block text-sm text-slate-400 hover:underline">Volver al inicio</Link>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-center gap-0">
              {STEPS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        i < step
                          ? "bg-brand-600 text-white"
                          : i === step
                            ? "bg-brand-600 text-white ring-4 ring-brand-100"
                            : "bg-slate-200 text-slate-500",
                      )}
                    >
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span className={cx("mt-1 text-[11px] font-medium", i === step ? "text-brand-700" : "text-slate-400")}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && <div className={cx("mx-1 mb-5 h-0.5 w-8", i < step ? "bg-brand-600" : "bg-slate-200")} />}
                </React.Fragment>
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
            )}

            {step === 0 && (
              <div className="grid gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setServiceId(s.id); setError(null); }}
                    className={cx(
                      "flex items-center justify-between rounded-xl border-2 p-4 text-left transition-colors",
                      serviceId === s.id ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300",
                    )}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{s.description || `${s.durationMinutes} min`}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-700">{formatCOP(s.price)}</div>
                      <div className="text-xs text-slate-400">{s.durationMinutes} min</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <Card className="p-5">
                <label className="mb-1 block text-sm font-medium text-slate-700">Elige la fecha</label>
                <Input type="date" min={todayStr} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    const label = i === 0 ? "Hoy" : i === 1 ? "Mañana" : d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
                    return (
                      <button
                        key={str}
                        onClick={() => { setDate(str); setTime(""); }}
                        className={cx(
                          "rounded-full border px-3 py-1 text-xs font-medium",
                          date === str ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-600 hover:border-brand-400",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      {new Date(date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <div className="text-xs text-slate-400">{selectedService?.name} · {selectedService?.durationMinutes} min</div>
                  </div>
                  <button className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setStep(1)}>
                    Cambiar fecha
                  </button>
                </div>
                {slotLoading && <p className="text-sm text-slate-400"><Spinner /> Buscando horarios…</p>}
                {!slotLoading && slots && slots.length === 0 && (
                  <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    No hay horarios disponibles para ese día. Elige otra fecha.
                  </p>
                )}
                {!slotLoading && slots && slots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((sl) => (
                      <button
                        key={sl}
                        onClick={() => { setTime(sl); setError(null); }}
                        className={cx(
                          "rounded-lg border-2 py-2 text-sm font-semibold",
                          time === sl
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-200 text-slate-700 hover:border-brand-400",
                        )}
                      >
                        {sl}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {step === 3 && (
              <Card className="space-y-4 p-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nombre completo *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Celular *</label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))} placeholder="+57 300 000 0000" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Notas (opcional)</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Algún detalle para tu cita…" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-slate-500">{selectedService?.name}</span>
                  <span className="font-bold text-brand-700">{formatCOP(selectedService?.price || "0")}</span>
                </div>
              </Card>
            )}

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
                ← Atrás
              </Button>
              <Button onClick={next} disabled={submitting} className="px-8">
                {submitting ? <><Spinner /> Reservando…</> : step === 3 ? "Confirmar cita" : "Continuar →"}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}