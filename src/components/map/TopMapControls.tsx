"use client";

import { Download, Flame, MapPin, Lasso, X, Layers, Hexagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useFilterStore, type H3Metric } from "@/lib/filter-store";

interface TopMapControlsProps {
  storeCount: number;
  totalCount: number;
  onExport: () => void;
  exporting: boolean;
  isLoading?: boolean;
  onRefresh: () => void;
  isSyncing: boolean;
  lastSyncedAt: number | null;
}

const METRIC_LABEL: Record<H3Metric, string> = {
  store_count: "Store count",
  whitespace_score: "Whitespace score",
  avg_rating: "Avg rating",
};

function formatSyncAge(lastSyncedAt: number | null): string {
  if (!lastSyncedAt) return "Never synced — click to load data";
  const diffMs = Date.now() - lastSyncedAt;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Synced just now";
  if (diffMins < 60) return `Synced ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Synced ${diffHours}h ago`;
  return `Synced ${Math.floor(diffHours / 24)}d ago`;
}

export default function TopMapControls({
  storeCount,
  totalCount,
  onExport,
  exporting,
  isLoading,
  onRefresh,
  isSyncing,
  lastSyncedAt,
}: TopMapControlsProps) {
  const viewMode = useFilterStore((s) => s.viewMode);
  const setViewMode = useFilterStore((s) => s.setViewMode);
  const lassoActive = useFilterStore((s) => s.lassoActive);
  const setLassoActive = useFilterStore((s) => s.setLassoActive);
  const lassoIds = useFilterStore((s) => s.lassoIds);
  const setLassoIds = useFilterStore((s) => s.setLassoIds);
  const layers = useFilterStore((s) => s.layers);
  const toggleLayer = useFilterStore((s) => s.toggleLayer);
  const h3Metric = useFilterStore((s) => s.h3Metric);
  const setH3Metric = useFilterStore((s) => s.setH3Metric);

  const exportCount =
    lassoIds && lassoIds.length ? lassoIds.length : storeCount;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] flex items-start justify-between gap-3 p-3">
      {/* Left controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Pins / Heatmap toggle */}
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface/95 p-1 shadow-[var(--shadow-elev-2)] backdrop-blur-md">
          <ToggleBtn
            active={viewMode === "pins"}
            onClick={() => setViewMode("pins")}
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Pins"
          />
          <ToggleBtn
            active={viewMode === "heatmap"}
            onClick={() => setViewMode("heatmap")}
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Heatmap"
          />
        </div>

        {/* Layers dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 shadow-[var(--shadow-elev-1)]">
              <Layers className="h-3.5 w-3.5" />
              Layers
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Data layers</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={layers.h3} onCheckedChange={() => toggleLayer("h3")}>
              <Hexagon className="mr-2 h-3.5 w-3.5" />
              H3 Heatmap
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={layers.stores} onCheckedChange={() => toggleLayer("stores")}>
              <MapPin className="mr-2 h-3.5 w-3.5" />
              Stores
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Reference</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={layers.roads} onCheckedChange={() => toggleLayer("roads")}>
              Roads
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={layers.railways} onCheckedChange={() => toggleLayer("railways")}>
              Railways
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={layers.waterways} onCheckedChange={() => toggleLayer("waterways")}>
              Waterways
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Color by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={h3Metric}
              onValueChange={(v) => setH3Metric(v as H3Metric)}
            >
              {(Object.keys(METRIC_LABEL) as H3Metric[]).map((m) => (
                <DropdownMenuRadioItem key={m} value={m}>
                  {METRIC_LABEL[m]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Store count */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/95 px-3 py-1.5 text-xs shadow-[var(--shadow-elev-2)] backdrop-blur-md">
          {(isLoading || isSyncing) && (
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 rounded-full bg-primary"
                  style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </span>
          )}
          <span className="font-semibold tabular-nums">{storeCount.toLocaleString()}</span>
          <span className="text-muted-foreground">of {totalCount.toLocaleString()} stores</span>
          {lassoIds && lassoIds.length > 0 && (
            <>
              <span className="text-border">·</span>
              <Badge variant="secondary" className="gap-1 text-[10px]">
                {lassoIds.length} in lasso
                <button
                  onClick={() => setLassoIds(null)}
                  className="rounded-full hover:text-destructive"
                  aria-label="Clear lasso"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </>
          )}
        </div>

        {/* Refresh / sync */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 shadow-[var(--shadow-elev-1)]"
          onClick={onRefresh}
          disabled={isSyncing}
          title={formatSyncAge(lastSyncedAt)}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing…" : "Refresh"}
        </Button>

        {/* Lasso */}
        <Button
          variant={lassoActive ? "default" : "outline"}
          size="sm"
          className="h-9 gap-1.5 shadow-[var(--shadow-elev-1)]"
          onClick={() => setLassoActive(!lassoActive)}
        >
          <Lasso className="h-3.5 w-3.5" />
          {lassoActive ? "Drawing…" : "Lasso"}
        </Button>

        {/* Export */}
        <Button
          size="sm"
          className="h-9 gap-1.5 shadow-[var(--shadow-elev-1)]"
          onClick={onExport}
          disabled={exporting || exportCount === 0}
        >
          {exporting ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export {exportCount > 0 ? exportCount.toLocaleString() : ""}
        </Button>
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
