"use client";

import { Star, Phone, Globe, MapPin, ImageIcon, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFilterStore } from "@/lib/filter-store";
import {
  STORE_TYPE_COLORS,
  STORE_TYPE_LABELS,
  type ConfidenceBucket,
} from "@/lib/store-types";
import { iconForStoreType } from "@/lib/store-type-icons";
import type { Store, StoreInsight, StoreTypeAnalysis } from "@/types";

interface EnrichedStore extends Store {
  insight?: StoreInsight;
  storeType?: StoreTypeAnalysis;
}

interface StoreDetailDrawerProps {
  store: EnrichedStore | null;
}

export default function StoreDetailDrawer({ store }: StoreDetailDrawerProps) {
  const setSelectedStoreId = useFilterStore((s) => s.setSelectedStoreId);
  const open = !!store;

  const type = store?.storeType?.store_type ?? "unknown";
  const color = STORE_TYPE_COLORS[type] ?? STORE_TYPE_COLORS.unknown;
  const TypeIcon = iconForStoreType(type);

  const cats = (store?.insight?.categories ?? {}) as ConfidenceBucket;
  const brands = (store?.insight?.brands ?? {}) as ConfidenceBucket;
  const assets = (store?.insight?.assets ?? {}) as Record<string, unknown>;
  const activeAssets = Object.entries(assets)
    .filter(([, v]) => Boolean(v))
    .map(([k]) => k);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setSelectedStoreId(null)}>
      <DialogContent className="max-h-[90vh] w-[92vw] max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
        {store && (
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="space-y-2 border-b border-border bg-surface-2 px-5 py-4">
              <DialogTitle className="pr-8 text-base font-semibold leading-tight">
                {store.store_name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className="gap-1 border-0 text-[10px] uppercase tracking-wider text-white"
                  style={{ background: color }}
                >
                  <TypeIcon className="h-3 w-3" strokeWidth={2.5} />
                  {STORE_TYPE_LABELS[type] ?? type}
                </Badge>
                {store.avg_rating != null && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {store.avg_rating}
                    <span className="text-muted-foreground">
                      ({store.reviews_count ?? 0})
                    </span>
                  </span>
                )}
                {store.insight?.confidence && (
                  <ConfidenceBadge level={store.insight.confidence} />
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <Stats
                items={[
                  {
                    icon: ImageIcon,
                    label: "Images",
                    value: store.insight?.image_count ?? 0,
                  },
                  {
                    icon: Building2,
                    label: "Categories",
                    value:
                      (cats.high_confidence?.length ?? 0) +
                      (cats.medium_confidence?.length ?? 0) +
                      (cats.low_confidence?.length ?? 0),
                  },
                  {
                    icon: Star,
                    label: "Brands",
                    value:
                      (brands.high_confidence?.length ?? 0) +
                      (brands.medium_confidence?.length ?? 0) +
                      (brands.low_confidence?.length ?? 0),
                  },
                ]}
              />

              <Separator />

              <Section title="Product Categories by Confidence">
                <Buckets data={cats} />
              </Section>

              <Section title="Brands by Confidence">
                <Buckets data={brands} />
              </Section>

              <Section title="Assets Detected">
                {activeAssets.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">No assets detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeAssets.map((a) => (
                      <Badge key={a} variant="secondary" className="text-[11px]">
                        {a.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </Section>

              <Separator />

              <Section title="Contact">
                <KV label="Address">
                  <span className="inline-flex items-start gap-1 text-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                    <span>
                      {[store.city, store.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </span>
                </KV>
                {store.phone && (
                  <KV label="Mobile">
                    <a
                      href={`tel:${store.phone}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" /> {store.phone}
                    </a>
                  </KV>
                )}
                {store.website && (
                  <KV label="Website">
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" /> Visit
                    </a>
                  </KV>
                )}
                {store.place_id && (
                  <KV label="Store Page">
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${store.place_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <MapPin className="h-3 w-3" /> View listing ↗
                    </a>
                  </KV>
                )}
              </Section>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    high: "bg-success/15 text-success border-success/30",
    medium: "bg-warning/15 text-warning border-warning/30",
    low: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] uppercase tracking-wider ${map[level] ?? ""}`}
    >
      {level} conf
    </Badge>
  );
}

function Stats({
  items,
}: {
  items: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-center"
        >
          <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-muted-foreground" />
          <div className="text-base font-semibold leading-none">{value}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function Buckets({ data }: { data: ConfidenceBucket }) {
  const groups: {
    key: keyof ConfidenceBucket;
    label: string;
    headerTone: string;
    badgeTone: string;
  }[] = [
    {
      key: "high_confidence",
      label: "High confidence",
      headerTone: "text-emerald-600",
      badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-300",
    },
    {
      key: "medium_confidence",
      label: "Medium confidence",
      headerTone: "text-amber-600",
      badgeTone: "bg-amber-50 text-amber-800 border-amber-300",
    },
    {
      key: "low_confidence",
      label: "Low confidence",
      headerTone: "text-rose-600",
      badgeTone: "bg-rose-50 text-rose-700 border-rose-300",
    },
  ];

  const total =
    (data.high_confidence?.length ?? 0) +
    (data.medium_confidence?.length ?? 0) +
    (data.low_confidence?.length ?? 0);

  if (total === 0)
    return <p className="text-xs italic text-muted-foreground">None detected.</p>;

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const items = data[g.key] ?? [];
        if (!items.length) return null;
        return (
          <div key={g.key}>
            <div
              className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wider ${g.headerTone}`}
            >
              {g.label} ({items.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {items.map((it) => (
                <Badge key={it} variant="outline" className={`text-[11px] ${g.badgeTone}`}>
                  {it}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
