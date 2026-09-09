import { API_URL, formatCOP, whatsappLink } from "@/lib/config";
import { PulseLine, Wordmark } from "@/components/brand";

export const revalidate = 300;

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: string;
};

type BusinessHour = {
  id: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  slotInterval: number;
};

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch(`${API_URL}/api/services`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchHours(): Promise<BusinessHour[]> {
  try {
    const res = await fetch(`${API_URL}/api/business-hours`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const [services, hours] = await Promise.all([fetchServices(), fetchHours()]);
  const wa = (msg: string) => whatsappLink(msg);

  return (
    <main className="flex-1">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Wordmark />
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <a href="#estudios" className="hover:text-brand-600">Estudios</a>
            <a href="#horario" className="hover:text-brand-600">Horario</a>
            <a href="#como-funciona" className="hover:text-brand-600">Cómo funciona</a>
            <a href="#donde-estamos" className="hover:text-brand-600">Dónde estamos</a>
          </div>
          <a
            href={wa("Hola CEDIMAX, quiero agendar una cita")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-gradient-to-r from-brand-500 to-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Reservar por WhatsApp
          </a>
        </div>
      </nav>

      <header className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <PulseLine className="absolute inset-x-0 top-0 h-10 w-full text-coral-400 opacity-20" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              ✦ Nuestra prioridad eres tú
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Agenda tu estudio{" "}
              <span className="bg-gradient-to-r from-brand-500 to-coral-500 bg-clip-text text-transparent">
                sin llamadas ni esperas
              </span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              CEDIMAX es un Centro de Imágenes Diagnósticas. Escríbenos por WhatsApp, elige tu ecografía o Doppler y
              agenda en minutos con confirmación inmediata al celular.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={wa("Hola CEDIMAX, quiero agendar una cita")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gradient-to-r from-brand-500 to-coral-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              >
                Escríbenos ahora
              </a>
              <a
                href="#estudios"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Ver estudios
              </a>
            </div>
            <PulseLine className="mt-10 max-w-xs text-coral-400" />
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-coral-500 text-2xl">
                🩺
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">CEDIMAX Reservas</div>
                <div className="text-xs text-brand-600">● En línea</div>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-slate-700">
                ¡Hola! 👋 ¿Qué estudio necesitas agendar?
              </div>
              <div className="rounded-xl bg-gradient-to-r from-brand-500 to-coral-500 px-4 py-3 text-white">
                Hola, quiero una ecografía abdominal
              </div>
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-slate-700">
                ¡Perfecto! Aquí está el enlace con los horarios 👇
              </div>
              <div className="rounded-xl bg-gradient-to-r from-brand-500 to-coral-500 px-4 py-3 text-white">
                ¡Listo, agendé para el jueves a las 9:00 am! 🎉
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="estudios" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-center gap-3">
          <PulseLine className="h-6 w-16 text-coral-400" />
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Nuestros estudios</h2>
          <PulseLine className="h-6 w-16 text-coral-400" />
        </div>
        <p className="mt-2 text-center text-slate-600">
          Ecografías, Doppler y radiografías. Elige tu estudio y reserva por WhatsApp; la preparación y las
          indicaciones se te confirman al agendar.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.length === 0 && (
            <p className="col-span-full text-center text-slate-400">No hay estudios disponibles por el momento.</p>
          )}
          {services.map((s) => (
            <div key={s.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-800">
                    {formatCOP(s.price)}
                  </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{s.description ?? "Consulta más detalles por WhatsApp."}</p>
              <p className="mt-4 text-xs font-medium text-slate-400">
                ⏱ {s.duration_minutes} min ·{" "}
                <a
                  href={wa(`Hola CEDIMAX, quiero agendar: ${s.name}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Reservar →
                </a>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="por-que" className="bg-gradient-to-r from-brand-50 to-coral-50 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
          {[
            { icon: "💗", t: "Atención centrada en ti", d: "Trato cálido y profesional en cada estudio. Nuestra prioridad eres tú." },
            { icon: "🩻", t: "Imágenes confiables", d: "Equipos de ecografía y Doppler para un diagnóstico certero." },
            { icon: "⚡", t: "Agenda ágil", d: "Reserva por WhatsApp en minutos y recibe tu confirmación al celular." },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="horario" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Horario de atención</h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {hours.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Horarios no disponibles.</p>}
            <div className="divide-y divide-slate-100">
              {hours.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span className="font-medium text-slate-700">{DAYS[h.dayOfWeek]}</span>
                  <span className="text-slate-500">
                    {h.openTime} – {h.closeTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">Domingos: cerrado.</p>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Así de fácil es reservar tu estudio</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Escríbenos por WhatsApp", d: "Mándanos un mensaje con el estudio que necesitas." },
            { n: "02", t: "Recibe tu enlace", d: "Nuestra asistente te responde al instante con el enlace para reservar." },
            { n: "03", t: "Confirma tu cita", d: "Elige fecha y hora, llena tus datos y recibe la confirmación." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-coral-500 text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="donde-estamos" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dónde estamos</h2>
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-4xl">📍</div>
            <h3 className="mt-3 text-xl font-bold text-slate-900">CEDIMAX · Centro de Imágenes Diagnósticas</h3>
            <p className="mt-2 text-sm text-slate-600">
              Calle 7 # 8-16, CC Los Pinos, Local 14
              <br />
              WhatsApp: 316 659 7322
            </p>
            <a
              href={wa("Hola CEDIMAX, quiero agendar una cita")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand-500 to-coral-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            >
              Agendar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-brand-500 to-coral-500 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">¿Listo para agendar tu estudio hoy?</h2>
          <a
            href={wa("Hola CEDIMAX, quiero agendar una cita")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-brand-700 shadow-md transition-colors hover:bg-brand-50"
          >
            Empezar por WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center">
        <div className="mb-2 flex justify-center">
          <Wordmark size="text-xl" />
        </div>
        <p className="text-sm text-slate-500">CEDIMAX · Centro de Imágenes Diagnósticas · Nuestra prioridad eres tú</p>
        <p className="mt-1 text-xs text-slate-400">
          © {new Date().getFullYear()} CEDIMAX · Calle 7 # 8-16, CC Los Pinos, Local 14
        </p>
      </footer>
    </main>
  );
}