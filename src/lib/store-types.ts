export const STORE_TYPE_COLORS: Record<string, string> = {
  kirana: "#f59e0b",
  grocery: "#22c55e",
  supermarket: "#0d9488",
  wholesale: "#0ea5e9",
  pharmacy: "#ef4444",
  "drug store": "#dc2626",
  cosmetics: "#ec4899",
  electronics: "#6366f1",
  apparel: "#a855f7",
  salon: "#d946ef",
  hardware: "#78716c",
  food_outlet: "#f97316",
  others: "#64748b",
  unknown: "#94a3b8",
};

export const STORE_TYPE_LABELS: Record<string, string> = {
  kirana: "Kirana",
  grocery: "Grocery",
  supermarket: "Supermarket",
  wholesale: "Wholesale",
  pharmacy: "Pharmacy",
  "drug store": "Drug Store",
  cosmetics: "Cosmetics",
  electronics: "Electronics",
  apparel: "Apparel",
  salon: "Salon",
  hardware: "Hardware",
  food_outlet: "Food Outlet",
  others: "Others",
  unknown: "Unknown",
};

const FALLBACK_PALETTE = [
  "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316",
];

export function labelStoreType(t: string | null | undefined): string {
  if (!t) return "Unknown";
  return STORE_TYPE_LABELS[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function colorForStoreType(t: string | null | undefined): string {
  if (!t) return STORE_TYPE_COLORS.unknown;
  if (STORE_TYPE_COLORS[t]) return STORE_TYPE_COLORS[t];
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
}

export const ASSET_OPTIONS = [
  { key: "visi_cooler", label: "Visi Cooler" },
  { key: "racks", label: "Racks" },
  { key: "posm", label: "POSM" },
  { key: "impulse_display", label: "Impulse Display" },
  { key: "outside_display", label: "Outside Display" },
  { key: "bulk_storage_visible", label: "Bulk Storage Visible" },
] as const;

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export type ConfidenceBucket = {
  high_confidence?: string[];
  medium_confidence?: string[];
  low_confidence?: string[];
};
