export interface Store {
  id: string;
  store_name: string;
  place_id: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  reviews_count: number | null;
  avg_rating: number | null;
  phone: string | null;
  website: string | null;
  company_id: string;
  h3_r5: string | null;
  h3_r7: string | null;
  h3_r9: string | null;
}

export interface StoreInsight {
  id: string;
  store_id: string;
  categories: Record<string, string[]>;
  brands: Record<string, string[]>;
  dominant_category: string | null;
  confidence: string | null;
  image_count: number;
  assets: Record<string, unknown>;
}

export interface StoreTypeAnalysis {
  id: string;
  store_id: string;
  store_type: string;
  raw_store_type: string | null;
  weighted_scores: Record<string, number>;
  confidence: number;
}

export interface H3Insight {
  id: string;
  h3_index: string;
  resolution: number;
  company_id: string;
  store_count: number;
  avg_rating: number | null;
  dominant_category: string | null;
  brand_penetration: Record<string, number>;
  category_mix: Record<string, number>;
  whitespace_score: number | null;
}

export type MapLayer = "density" | "whitespace" | "brands" | "stores";

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface StoreFilters {
  state: string;
  city: string;
  storeTypes: string[];
  brandsIdentified: "any" | "yes" | "no";
  categoriesIdentified: "any" | "yes" | "no";
  categories: string[];
  brands: string[];
  assets: string[];
  confidence: string[];
  minRating: number | null;
  maxRating: number | null;
  minReviews: number | null;
}

export const DEFAULT_FILTERS: StoreFilters = {
  state: "",
  city: "",
  storeTypes: [],
  brandsIdentified: "any",
  categoriesIdentified: "any",
  categories: [],
  brands: [],
  assets: [],
  confidence: [],
  minRating: null,
  maxRating: null,
  minReviews: null,
};

export interface FilterOptions {
  states: string[];
  cities: string[];
  storeTypes: string[];
  categories: string[];
  brands: string[];
}
