"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import FilterPanel from "./FilterPanel";
import type { FilterOptions } from "@/types";

const MapContainer = dynamic(() => import("./MapContainer"), { ssr: false });

const EMPTY_OPTIONS: FilterOptions = {
  states: [],
  cities: [],
  storeTypes: [],
  categories: [],
  brands: [],
};

interface MapLayoutProps {
  companyId?: string;
}

export default function MapLayout({ companyId }: MapLayoutProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_OPTIONS);

  useEffect(() => {
    const params = companyId ? `?company_id=${companyId}` : "";
    fetch(`/api/filter-options${params}`)
      .then((r) => r.json())
      .then((data: FilterOptions) => setFilterOptions(data))
      .catch(console.error);
  }, [companyId]);

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <FilterPanel options={filterOptions} />
      <div className="relative min-w-0 flex-1">
        <MapContainer companyId={companyId} />
      </div>
    </div>
  );
}
