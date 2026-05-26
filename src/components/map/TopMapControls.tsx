"use client";

import type { MapLayer } from "@/types";

interface TopMapControlsProps {
  activeLayer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  showStores: boolean;
  onToggleStores: () => void;
  storeCount: number;
  totalCount: number;
  lassoActive: boolean;
  onToggleLasso: () => void;
  lassoedCount: number | null;
  onExport: () => void;
  exporting: boolean;
}

const HEX_LAYERS: { id: MapLayer; label: string }[] = [
  { id: "density", label: "Density" },
  { id: "whitespace", label: "Whitespace" },
  { id: "brands", label: "Brands" },
];

export default function TopMapControls({
  activeLayer,
  onLayerChange,
  showStores,
  onToggleStores,
  storeCount,
  totalCount,
  lassoActive,
  onToggleLasso,
  lassoedCount,
  onExport,
  exporting,
}: TopMapControlsProps) {
  const isHeatmap = activeLayer !== "stores";
  const exportCount = lassoedCount !== null ? lassoedCount : storeCount;

  const handlePinsClick = () => {
    if (isHeatmap) onLayerChange("stores");
    if (!showStores) onToggleStores();
  };

  const handleHeatmapClick = () => {
    if (!isHeatmap) onLayerChange("density");
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 pointer-events-none">
      {/* Pins / Heatmap toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white pointer-events-auto">
        <button
          onClick={handlePinsClick}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            !isHeatmap
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          Pins
        </button>
        <button
          onClick={handleHeatmapClick}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
            isHeatmap
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Heatmap
        </button>
      </div>

      {/* Heatmap sub-type selector (only when heatmap active) */}
      {isHeatmap && (
        <div className="flex rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white pointer-events-auto">
          {HEX_LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={`px-3 py-2 text-xs font-medium transition-colors border-l first:border-l-0 border-gray-200 ${
                activeLayer === layer.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      )}

      {/* Store count */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-2 text-sm font-medium text-gray-700 pointer-events-auto whitespace-nowrap">
        {lassoedCount !== null
          ? `${lassoedCount} selected`
          : `${storeCount} of ${totalCount} stores`}
      </div>

      {/* Lasso */}
      <button
        onClick={onToggleLasso}
        title={lassoActive ? "Cancel lasso (Esc)" : "Lasso selection"}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border shadow-sm transition-colors pointer-events-auto ${
          lassoActive
            ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        </svg>
        Lasso
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        disabled={exporting || exportCount === 0}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border shadow-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors pointer-events-auto whitespace-nowrap"
      >
        {exporting ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        Export {exportCount}
      </button>
    </div>
  );
}
