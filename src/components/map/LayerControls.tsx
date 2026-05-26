"use client";

import type { MapLayer } from "@/types";

interface LayerControlsProps {
  activeLayer: MapLayer;
  showStores: boolean;
  onLayerChange: (layer: MapLayer) => void;
  onToggleStores: () => void;
}

const LAYERS: { id: MapLayer; label: string; description: string }[] = [
  { id: "density", label: "Store Density", description: "Hexagons colored by store count per cell" },
  { id: "whitespace", label: "Whitespace", description: "Green = high opportunity (low brand presence)" },
  { id: "brands", label: "Brand Penetration", description: "Purple intensity = brand saturation" },
];

export default function LayerControls({
  activeLayer,
  showStores,
  onLayerChange,
  onToggleStores,
}: LayerControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 w-56 shadow-2xl">
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
        Map Layers
      </p>

      <div className="space-y-1 mb-4">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            title={layer.description}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeLayer === layer.id
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      <div className="border-t border-[var(--border)] pt-3">
        <button
          onClick={onToggleStores}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
            showStores
              ? "text-[var(--foreground)]"
              : "text-[var(--muted)]"
          } hover:bg-[var(--surface-hover)]`}
        >
          <span
            className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
              showStores ? "bg-amber-400 border-amber-400" : "border-[var(--muted)]"
            }`}
          />
          Store Pins
        </button>
      </div>
    </div>
  );
}
