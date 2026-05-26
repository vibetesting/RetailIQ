"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import FilterPanel from "./FilterPanel";
import type { StoreFilters, FilterOptions } from "@/types";
import { DEFAULT_FILTERS } from "@/types";

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
  // filters drives the UI immediately; debouncedFilters drives the API (400ms delay)
  const [filters, setFilters] = useState<StoreFilters>(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<StoreFilters>(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_OPTIONS);
  const [storeCount, setStoreCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [lassoedIds, setLassoedIds] = useState<string[] | null>(null);

  // Debounce filter changes — API calls fire 400ms after the last change
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    const params = companyId ? `?company_id=${companyId}` : "";
    fetch(`/api/filter-options${params}`)
      .then((r) => r.json())
      .then((data: FilterOptions) => setFilterOptions(data))
      .catch(console.error);
  }, [companyId]);

  const handleStoreCountChange = useCallback((filtered: number, total: number) => {
    setStoreCount(filtered);
    setTotalCount(total);
  }, []);

  const handleLassoChange = useCallback((ids: string[] | null) => {
    setLassoedIds(ids);
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <FilterPanel
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
      />
      <div className="flex-1 relative min-w-0">
        <MapContainer
          companyId={companyId}
          filters={debouncedFilters}
          onStoreCountChange={handleStoreCountChange}
          onLassoChange={handleLassoChange}
          lassoedIds={lassoedIds}
          storeCount={storeCount}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
