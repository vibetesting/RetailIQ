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
  isLoading?: boolean;
}

const HEX_LAYERS: { id: MapLayer; label: string }[] = [
  { id: "density", label: "Density" },
  { id: "whitespace", label: "Whitespace" },
  { id: "brands", label: "Brands" },
];

export default function TopMapControls({
  activeLayer, onLayerChange, showStores, onToggleStores,
  storeCount, totalCount, lassoActive, onToggleLasso,
  lassoedCount, onExport, exporting, isLoading,
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

      {/* Pins / Heatmap toggle — glassmorphism */}
      <div className="flex rounded-2xl overflow-hidden border border-white/40 shadow-lg shadow-black/10 backdrop-blur-md bg-white/85 pointer-events-auto">
        <button
          onClick={handlePinsClick}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
            !isHeatmap ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-white/60"
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          Pins
        </button>
        <button
          onClick={handleHeatmapClick}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 border-l border-white/30 ${
            isHeatmap ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-white/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Heatmap
        </button>
      </div>

      {/* Heatmap sub-layer picker */}
      {isHeatmap && (
        <div className="flex rounded-2xl overflow-hidden border border-white/40 shadow-lg shadow-black/10 backdrop-blur-md bg-white/85 pointer-events-auto">
          {HEX_LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onLayerChange(layer.id)}
              className={`px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95 border-l first:border-l-0 border-white/30 ${
                activeLayer === layer.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      )}

      {/* Store count */}
      <div className="flex items-center gap-2 backdrop-blur-md bg-white/85 border border-white/40 shadow-lg shadow-black/10 rounded-2xl px-4 py-2.5 pointer-events-auto whitespace-nowrap">
        {isLoading && (
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-blue-500"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </span>
        )}
        <span className="text-sm font-semibold text-gray-700 tabular-nums">
          {lassoedCount !== null
            ? <><span className="text-blue-600">{lassoedCount}</span> selected</>
            : <>{storeCount} stores</>}
        </span>
      </div>

      {/* Lasso */}
      <button
        onClick={onToggleLasso}
        title={lassoActive ? "Cancel lasso (Esc)" : "Draw a selection polygon"}
        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-2xl border shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-200 active:scale-95 pointer-events-auto ${
          lassoActive
            ? "bg-orange-500 text-white border-orange-400/50 ring-2 ring-orange-400/40"
            : "bg-white/85 text-gray-700 border-white/40 hover:bg-white/95"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        </svg>
        {lassoActive ? "Drawing…" : "Lasso"}
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        disabled={exporting || exportCount === 0}
        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-2xl shadow-lg shadow-blue-500/20 bg-blue-600 text-white border border-blue-500/50 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 pointer-events-auto whitespace-nowrap"
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
        Export {exportCount > 0 ? exportCount : ""}
      </button>
    </div>
  );
}
