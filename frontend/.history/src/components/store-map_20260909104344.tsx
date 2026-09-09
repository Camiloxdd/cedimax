"use client";

import { useEffect, useRef, useState } from "react";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { MapPinIcon, PhoneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { GOOGLE_MAPS_API_KEY, whatsappLink } from "@/lib/config";

type LatLngLiteral = google.maps.LatLngLiteral;

const STORE = {
  name: "CEDIMAX",
  address: "Cra. 5 # 5-40, Madrid, Cundinamarca",
  phone: "316 659 7322",
  phoneHref: "tel:+573166597322",
  whatsapp: "316 659 7322",
  zoom: 16,
};

const FALLBACK_CENTER: LatLngLiteral = { lat: 4.73094, lng: -74.26417 };

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e3e8f0" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#e9ecf3" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#dde2ec" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#cfd7e5" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#8a94a6" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d6e4f5" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#eef1f5" }] },
];

const WA_MESSAGE = "Hola CEDIMAX, quiero agendar una cita";

function mapsUrl(kind: "search" | "dir"): string {
  const q = encodeURIComponent(`${STORE.name} ${STORE.address}`);
  return kind === "dir"
    ? `https://www.google.com/maps/dir/?api=1&destination=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function StoreMap() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "cedimax-map",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  const [coords, setCoords] = useState<LatLngLiteral | null>(null);
  const [iwOpen, setIwOpen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!isLoaded || !GOOGLE_MAPS_API_KEY || loadError || !window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: STORE.address, region: "co" }, (results) => {
      const loc = results?.[0]?.geometry?.location;
      setCoords(loc ? { lat: loc.lat(), lng: loc.lng() } : FALLBACK_CENTER);
    });
  }, [isLoaded, loadError]);

  const openWindow = () => {
    setIwOpen(true);
    if (mapRef.current && coords) mapRef.current.panTo(coords);
  };

  const closeWindow = () => setIwOpen(false);

  return (
    <div className="cdx-map relative h-[500px] w-full overflow-hidden rounded-tl-[2rem] rounded-br-[2rem] md:h-[440px]">
      {isLoaded && coords ? (
        <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={coords}
            zoom={STORE.zoom}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onUnmount={() => {
              mapRef.current = null;
            }}
            onClick={closeWindow}
            options={{
              styles: MAP_STYLES,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              rotateControl: false,
              gestureHandling: "greedy",
            }}
          >
            <Marker
              position={coords}
              onClick={() => setIwOpen(true)}
              onMouseOver={() => setIwOpen(true)}
              title={STORE.name}
              icon={{
                url: "/images/map-pin.svg",
                scaledSize: new window.google.maps.Size(44, 56),
                anchor: new window.google.maps.Point(22, 56),
              }}
            />

            {iwOpen && (
              <InfoWindow
                position={coords}
                onCloseClick={closeWindow}
              >
                <div className="relative w-64">
                  <button
                    type="button"
                    onClick={closeWindow}
                    aria-label="Cerrar"
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:text-slate-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>

                  <div className="p-4 pb-2">
                    <p className="text-base font-bold leading-tight text-slate-900">{STORE.name}</p>
                    <div className="mt-2 space-y-2 text-xs text-slate-600">
                      <p className="flex items-start gap-1.5">
                        <MapPinIcon className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" />
                        {STORE.address}
                      </p>
                      <a href={STORE.phoneHref} className="flex items-center gap-1.5 transition hover:text-brand-700">
                        <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                        {STORE.phone}
                      </a>
                      <a
                        href={whatsappLink(WA_MESSAGE)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 transition hover:text-brand-700"
                      >
                        <WaIcon className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                        {STORE.whatsapp}
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 pt-2">
                    <a
                      href={whatsappLink(WA_MESSAGE)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-full bg-coral-500 py-2 text-center text-sm font-bold text-white transition hover:bg-coral-600"
                    >
                      AGENDAR CITA
                    </a>
                    <a
                      href={mapsUrl("dir")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-full border border-slate-200 py-2 text-center text-sm font-bold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                    >
                      COMO LLEGAR
                    </a>
                    <a
                      href={mapsUrl("search")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-semibold text-brand-600 transition hover:text-brand-700"
                    >
                      VER MAS
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : !GOOGLE_MAPS_API_KEY || loadError ? (
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(STORE.address)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`}
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicacion de CEDIMAX"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-slate-100">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm">Cargando mapa...</span>
            </div>
          </div>
        )}

        {/* Floating panel */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4 md:pointer-events-auto md:inset-auto md:left-10 md:top-10 md:block md:w-[22rem] md:p-0">
          <div className="pointer-events-auto w-full max-w-sm rounded-tl-2xl rounded-br-2xl bg-white/95 p-5 shadow-xl shadow-slate-900/10 backdrop-blur sm:p-6 md:max-w-none">
            <p className="text-sm font-medium text-slate-600">Encuentranos en</p>
            <h3 className="mt-0.5 text-2xl font-bold gradient-text">{STORE.name}</h3>

            <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-600 to-coral-500 p-4 text-white shadow-lg shadow-brand-500/25">
              <p className="text-xs font-bold uppercase tracking-[0.18em]">{STORE.name}</p>
              <p className="mt-1 text-sm text-white/90">{STORE.address}</p>

              <div className="mt-3 space-y-1.5 text-sm">
                <a href={STORE.phoneHref} className="flex items-center gap-2 transition hover:text-white/80">
                  <PhoneIcon className="h-4 w-4 shrink-0 text-white/90" />
                  {STORE.phone}
                </a>
                <a
                  href={whatsappLink(WA_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-white/80"
                >
                  <WaIcon className="h-4 w-4 shrink-0 text-white/90" />
                  {STORE.whatsapp}
                </a>
              </div>

              <button
                type="button"
                onClick={openWindow}
                className="mt-4 w-full rounded-full bg-white py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
              >
                VER MAS
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }