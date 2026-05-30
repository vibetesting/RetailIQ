"use client";

import dynamic from "next/dynamic";
import FilterPanel from "./FilterPanel";

const MapContainer = dynamic(() => import("./MapContainer"), { ssr: false });

interface MapLayoutProps {
  companyId?: string;
}

export default function MapLayout({ companyId }: MapLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden bg-background">
      <FilterPanel />
      <div className="relative min-w-0 flex-1">
        <MapContainer companyId={companyId} />
      </div>
    </div>
  );
}
