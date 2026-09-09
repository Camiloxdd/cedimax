import { API_URL, formatCOP, whatsappLink } from "@/lib/config";
import { Navbar } from "@/components/navbar";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Reveal } from "@/components/reveal";
import { CenterTimeline, type TimelineStep } from "@/components/center-timeline";
import { StoreMap } from "@/components/store-map";
import { SiteFooter } from "@/components/site-footer";
import Image from "next/image";
import {
  ArrowRightIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  HeartIcon,
  LinkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const STEPS: TimelineStep[] = [
  {
    n: "01",
    title: "Escribenos por WhatsApp",
    desc: "Mandanos un mensaje con el estudio que necesitas.",
    icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
  },
  {
    n: "02",
    title: "Recibe tu enlace",
    desc: "Nuestra asistente te responde al instante con el enlace para reservar.",
    icon: <LinkIcon className="h-6 w-6" />,
  },
  {
    n: "03",
    title: "Confirma tu cita",
    desc: "Elige fecha y hora, llena tus datos y recibe la confirmacion.",
    icon: <CheckCircleIcon className="h-6 w-6" />,
  },
];

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

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

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
    <main className="min-h-screen bg-[#fafbfc]">
      <Navbar />
      <WhatsAppButton />

      {/* Hero Section - Asymmetric Layout */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-28 md:pb-24">
        {/* Background decorative elements */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -left-32 top-1/2 h-72 w-72 rounded-full bg-coral-100/40 blur-3xl" />
        
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          {/* Left content */}
          <Reveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
              Centro de Imagenes Diagnosticas
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Agenda tu estudio{" "}
              <span className="gradient-text">
                sin llamadas ni esperas
              </span>
            </h1>
            
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              Escríbenos por WhatsApp, elige tu ecografia o Doppler y agenda en minutos con confirmacion inmediata al celular.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={wa("Hola CEDIMAX, quiero agendar una cita")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Escribenos ahora
              </a>
              <a
                href="#estudios"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                Ver estudios
                <ChevronDownIcon className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          {/* Right - Floating SVG Illustration */}
          <Reveal direction="scale" delay={150} className="relative flex items-center justify-center">
            <div className="relative">
              {/* Decorative rings */}
              <div className="absolute inset-0 -m-8 rounded-full border border-brand-200/30" />
              <div className="absolute inset-0 -m-16 rounded-full border border-coral-200/20" />
              
              {/* Main illustration */}
              <div className="relative animate-float">
                <div className="double-bezel">
                  <div className="double-bezel-inner flex items-center justify-center p-8 md:p-12">
                    <Image
                      src="/images/doctor.svg"
                      alt="Profesional medico CEDIMAX"
                      width={320}
                      height={320}
                      className="h-auto w-64 md:w-80"
                      priority
                    />
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -right-4 top-8 animate-float-delayed">
                <div className="glass-card rounded-2xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Confirmacion</div>
                      <div className="text-[10px] text-slate-500">Inmediata al celular</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-slate-100 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 md:gap-16">
          {[
            { num: "+500", label: "Estudios realizados" },
            { num: "100%", label: "Confirmacion inmediata" },
            { num: "24h", label: "Disponibilidad WhatsApp" },
            { num: "15+", label: "Anos de experiencia" },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100} className="text-center">
              <div className="text-2xl font-bold gradient-text">{stat.num}</div>
              <div className="mt-0.5 text-xs text-slate-500">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Estudios Section */}
      <section id="estudios" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Nuestros estudios
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Ecografias, Doppler y radiografias. Elige tu estudio y reserva por WhatsApp; la preparacion y las indicaciones se te confirman al agendar.
          </p>
        </Reveal>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.length === 0 && (
            <p className="col-span-full text-center text-slate-400">No hay estudios disponibles por el momento.</p>
          )}
          {services.map((s, i) => (
            <Reveal
              key={s.id}
              delay={i * 120}
              className="double-bezel hover-lift"
            >
              <div className="double-bezel-inner p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                  <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                    {formatCOP(s.price)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  {s.description ?? "Consulta mas detalles por WhatsApp."}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    {s.duration_minutes} min
                  </span>
                  <a
                    href={wa(`Hola CEDIMAX, quiero agendar: ${s.name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                  >
                    Reservar
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Por que CEDIMAX - Reasons */}
      <section id="por-que" className="relative overflow-hidden bg-white py-20 md:py-28">
        <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-coral-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal className="mb-12 text-center md:mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Por que elegir <span className="gradient-text">CEDIMAX</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Tecnologia, trato humano y reserva inmediata, todo en un mismo lugar.
            </p>
          </Reveal>

          <div className="grid items-stretch gap-6 lg:grid-cols-12">
            {/* Reasons list */}
            <div className="flex flex-col justify-center gap-4 lg:col-span-7">
              {[
                {
                  title: "Atencion centrada en ti",
                  desc: "Trato calido y profesional en cada estudio. Nuestra prioridad eres tu, con la mejor tecnologia y personal experto.",
                  icon: (
                    <HeartIcon className="h-6 w-6 text-white" />
                  ),
                },
                {
                  title: "Imagenes confiables",
                  desc: "Equipos de ecografia y Doppler para un diagnostico certero.",
                  icon: (
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  ),
                },
                {
                  title: "Agenda agil",
                  desc: "Reserva por WhatsApp en minutos y recibe tu confirmacion al celular.",
                  icon: (
                    <BoltIcon className="h-6 w-6 text-white" />
                  ),
                },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 120} className="double-bezel group">
                  <div className="double-bezel-inner flex flex-col items-start gap-4 p-5 transition-all duration-300 sm:flex-row sm:items-center md:p-6 group-hover:-translate-y-1 group-hover:shadow-[0_16px_40px_rgba(232,52,140,0.14)]">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-coral-500 shadow-lg shadow-brand-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      {f.icon}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs font-bold tracking-widest text-brand-500 transition-colors duration-300 group-hover:text-brand-700">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-brand-700">{f.title}</h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 group-hover:text-slate-700">{f.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Featured panel */}
            <Reveal direction="scale" delay={200} className="lg:col-span-5">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#141233] via-[#1e1a4d] to-[#3a1d6e] p-8 text-white md:p-10">
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 rounded-full border border-brand-400/20" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-200 backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-300" />
                    Centro de Imagenes Diagnosticas
                  </div>
                  <h3 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">
                    La confianza de
                    <br />
                    <span className="gradient-text">empezar bien</span>
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
                    Cada estudio se realiza con tecnologia de punta y un equipo que te acompania antes, durante y despues.
                  </p>
                </div>

                <div className="relative mt-10 flex items-center justify-center">
                  <div className="relative animate-float">
                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                      <Image
                        src="/images/medicine.svg"
                        alt="Atencion medica de confianza"
                        width={520}
                        height={347}
                        className="h-auto w-44 md:w-52"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Horario Section */}
      <section id="horario" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left - SVG */}
            <Reveal direction="right" className="flex justify-center">
              <div className="animate-float">
                <div className="double-bezel">
                  <div className="double-bezel-inner p-8">
                    <Image
                      src="/images/prescription.svg"
                      alt="Horario de atencion"
                      width={280}
                      height={280}
                      className="h-auto w-56 md:w-64"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
            
            {/* Right - Schedule */}
            <Reveal direction="left" delay={150}>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Horario de atencion</h2>
              <p className="mt-3 text-slate-600">Encuentranos en el horario que mas te convenga.</p>
              
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                {hours.length === 0 && (
                  <p className="p-6 text-center text-sm text-slate-400">Horarios no disponibles.</p>
                )}
                <div className="divide-y divide-slate-50">
                  {hours.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
                      <span className="font-medium text-slate-700">{DAYS[h.dayOfWeek]}</span>
                      <span className="text-slate-500">
                        {h.openTime} - {h.closeTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-slate-400">Domingos: cerrado</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Como Funciona - Steps */}
      <section id="como-funciona" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Asi de facil es reservar tu estudio
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Un unico punto de partida: tu mensaje. Desde el centro se despliegan los pasos para llegar a tu cita.
            </p>
          </Reveal>

          <CenterTimeline steps={STEPS} />
        </div>
      </section>

      {/* Donde Estamos */}
      <section id="donde-estamos" className="relative overflow-hidden bg-gradient-to-b from-transparent via-brand-50/40 to-transparent py-20 md:py-28">
        <div className="pointer-events-none absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-coral-100/30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-50/50 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
              <span className="font-medium">UBICANOS</span>{" "}
              <span className="underline decoration-black decoration-2 underline-offset-8">
                AQUI
              </span>
            </h2>
          </div>
          <StoreMap />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
        <div className="relative mx-auto max-w-4xl px-4">
          <Reveal direction="scale">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#141233] via-[#1e1a4d] to-[#3a1d6e] px-6 py-16 text-center md:px-12 md:py-20">
              <div aria-hidden="true" className="pointer-events-none absolute -left-14 -top-14 h-48 w-48 rounded-full border border-white/10" />
              <div aria-hidden="true" className="pointer-events-none absolute -left-6 -top-6 h-48 w-48 rounded-full border border-brand-400/20" />
              <div aria-hidden="true" className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full border border-white/10" />
              <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-coral-500/10 blur-3xl" />

              <div className="absolute right-6 top-6 animate-float md:right-8 md:top-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-400/40 bg-brand-500/20 backdrop-blur">
                  <svg className="h-6 w-6 text-brand-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Listo para agendar tu estudio{" "}
                <span className="text-brand-400">hoy?</span>
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Responde al instante y confirma tu cita en minutos
              </p>
              <a
                href={wa("Hola CEDIMAX, quiero agendar una cita")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-bold text-brand-700 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Escribenos ahora
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </main>
  );
}
