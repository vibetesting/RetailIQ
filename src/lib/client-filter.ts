import type { CachedStore, StoreFilters, ViewportBounds, FilterOptions } from "@/types";

function flattenJsonb(jsonb: unknown): string[] {
  if (!jsonb || typeof jsonb !== "object") return [];
  const result: string[] = [];
  for (const vals of Object.values(jsonb as Record<string, unknown>)) {
    if (Array.isArray(vals)) result.push(...vals.map(String));
  }
  return result;
}

function hasBrands(brands: unknown): boolean {
  return flattenJsonb(brands).length > 0;
}

function hasCategories(categories: unknown): boolean {
  return flattenJsonb(categories).length > 0;
}

/**
 * Client-side equivalent of /api/stores.
 * Runs entirely in-memory against the cached store list — no network call.
 * viewport=null skips the bbox check (used before the map has initialised).
 */
export function applyClientFilters(
  stores: CachedStore[],
  filters: StoreFilters,
  viewport: ViewportBounds | null,
): CachedStore[] {
  const needsInsight =
    filters.brandsIdentified !== "any" ||
    filters.categoriesIdentified !== "any" ||
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.assets.length > 0 ||
    filters.confidence.length > 0;

  return stores.filter((s) => {
    // 1. Viewport bbox (cheapest check first)
    if (viewport) {
      if (s.latitude == null || s.longitude == null) return false;
      if (s.latitude < viewport.south || s.latitude > viewport.north) return false;
      if (s.longitude < viewport.west || s.longitude > viewport.east) return false;
    }

    // 2. Location
    if (filters.state && s.state !== filters.state) return false;
    if (filters.city && s.city !== filters.city) return false;

    // 3. Rating / reviews
    if (filters.minRating !== null && (s.avg_rating ?? 0) < filters.minRating) return false;
    if (filters.maxRating !== null && (s.avg_rating ?? 0) > filters.maxRating) return false;
    if (filters.minReviews !== null && (s.reviews_count ?? 0) < filters.minReviews) return false;

    // 4. Store type
    if (filters.storeTypes.length > 0) {
      if (!s.storeType || !filters.storeTypes.includes(s.storeType.store_type)) return false;
    }

    // 5. Insight-based filters
    if (needsInsight) {
      const insight = s.insight;

      if (filters.brandsIdentified === "yes" && !hasBrands(insight?.brands)) return false;
      if (filters.brandsIdentified === "no" && hasBrands(insight?.brands)) return false;
      if (filters.categoriesIdentified === "yes" && !hasCategories(insight?.categories)) return false;
      if (filters.categoriesIdentified === "no" && hasCategories(insight?.categories)) return false;

      if (filters.confidence.length > 0) {
        const conf = (insight?.confidence ?? "").toLowerCase();
        if (!filters.confidence.map((c) => c.toLowerCase()).includes(conf)) return false;
      }
      if (filters.categories.length > 0) {
        const cats = flattenJsonb(insight?.categories);
        if (!filters.categories.every((c) => cats.includes(c))) return false;
      }
      if (filters.brands.length > 0) {
        const brs = flattenJsonb(insight?.brands);
        if (!filters.brands.every((b) => brs.includes(b))) return false;
      }
      if (filters.assets.length > 0) {
        const assets = (insight?.assets ?? {}) as Record<string, unknown>;
        if (!filters.assets.every((a) => Boolean(assets[a]))) return false;
      }
    }

    return true;
  });
}

/**
 * Derives FilterOptions from the cached store list.
 * Replaces the /api/filter-options API call — no network needed.
 * Memoize this on allStores identity, not on every render.
 */
export function deriveFilterOptions(stores: CachedStore[]): FilterOptions {
  const stateSet = new Set<string>();
  const citySet = new Set<string>();
  const typeSet = new Set<string>();
  const categorySet = new Set<string>();
  const brandSet = new Set<string>();

  for (const s of stores) {
    if (s.state) stateSet.add(s.state);
    if (s.city) citySet.add(s.city);
    if (s.storeType?.store_type) typeSet.add(s.storeType.store_type);
    for (const item of flattenJsonb(s.insight?.categories)) categorySet.add(item);
    for (const item of flattenJsonb(s.insight?.brands)) brandSet.add(item);
  }

  return {
    states: [...stateSet].sort(),
    cities: [...citySet].sort(),
    storeTypes: [...typeSet].sort(),
    categories: [...categorySet].sort(),
    brands: [...brandSet].sort(),
  };
}
