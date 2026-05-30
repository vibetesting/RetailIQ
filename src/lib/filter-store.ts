import { create } from "zustand";
import type { StoreFilters } from "@/types";
import { DEFAULT_FILTERS } from "@/types";

export type ViewMode = "pins" | "heatmap";
export type H3Metric = "store_count" | "whitespace_score" | "avg_rating";

export type LayerToggles = {
  h3: boolean;
  stores: boolean;
  roads: boolean;
  railways: boolean;
  waterways: boolean;
};

const initialLayers: LayerToggles = {
  h3: true,
  stores: true,
  roads: false,
  railways: false,
  waterways: false,
};

type S = {
  filters: StoreFilters;
  setFilter: <K extends keyof StoreFilters>(k: K, v: StoreFilters[K]) => void;
  toggleArray: (
    k: "storeTypes" | "categories" | "brands" | "assets" | "confidence",
    v: string,
  ) => void;
  reset: () => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string | null) => void;
  lassoIds: string[] | null;
  setLassoIds: (ids: string[] | null) => void;
  lassoActive: boolean;
  setLassoActive: (b: boolean) => void;
  layers: LayerToggles;
  toggleLayer: (k: keyof LayerToggles) => void;
  h3Metric: H3Metric;
  setH3Metric: (m: H3Metric) => void;
};

export const useFilterStore = create<S>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilter: (k, v) => set((s) => ({ filters: { ...s.filters, [k]: v } })),
  toggleArray: (k, v) =>
    set((s) => {
      const cur = s.filters[k] as string[];
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      return { filters: { ...s.filters, [k]: next } };
    }),
  reset: () => set({ filters: DEFAULT_FILTERS }),
  viewMode: "pins",
  setViewMode: (v) => set({ viewMode: v }),
  selectedStoreId: null,
  setSelectedStoreId: (id) => set({ selectedStoreId: id }),
  lassoIds: null,
  setLassoIds: (ids) => set({ lassoIds: ids }),
  lassoActive: false,
  setLassoActive: (b) => set({ lassoActive: b }),
  layers: initialLayers,
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  h3Metric: "store_count",
  setH3Metric: (m) => set({ h3Metric: m }),
}));
