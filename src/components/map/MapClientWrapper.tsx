"use client";

import dynamic from "next/dynamic";

// Leaflet accesses window/document — must be dynamically imported client-side
const MapContainer = dynamic(
  () => import("./MapContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--surface)]">
        <div className="text-[var(--muted)] text-sm animate-pulse">Loading map…</div>
      </div>
    ),
  }
);

export default function MapClientWrapper({ companyId }: { companyId?: string }) {
  return <MapContainer companyId={companyId} />;
}
