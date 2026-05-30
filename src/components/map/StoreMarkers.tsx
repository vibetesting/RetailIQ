"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { useFilterStore } from "@/lib/filter-store";
import { colorForStoreType, labelStoreType, STORE_TYPE_COLORS } from "@/lib/store-types";
import { iconForStoreType } from "@/lib/store-type-icons";
import type { Store, StoreTypeAnalysis } from "@/types";

interface EnrichedStore extends Store {
  storeType?: StoreTypeAnalysis;
}

interface StoreMarkersProps {
  stores: EnrichedStore[];
}

function pinIcon(color: string, type: string) {
  const Icon = iconForStoreType(type);
  const svg = renderToStaticMarkup(
    <Icon size={14} color="white" strokeWidth={2.5} />,
  );
  return L.divIcon({
    className: "",
    html: `<div class="store-pin" style="background:${color}">${svg}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export default function StoreMarkers({ stores }: StoreMarkersProps) {
  const map = useMap();
  const setSelectedStoreId = useFilterStore((s) => s.setSelectedStoreId);

  useEffect(() => {
    const markers: L.Marker[] = [];

    stores.forEach((store) => {
      if (store.latitude == null || store.longitude == null) return;

      const type = store.storeType?.store_type ?? "unknown";
      const color = colorForStoreType(type);
      const typeColor = STORE_TYPE_COLORS[type] ?? STORE_TYPE_COLORS.unknown;

      const marker = L.marker([store.latitude, store.longitude], {
        icon: pinIcon(color, type),
      });

      marker.bindTooltip(
        `<strong>${store.store_name}</strong><br/><span style="color:${typeColor}">${labelStoreType(type)}</span>${store.avg_rating ? ` · ★ ${store.avg_rating}` : ""}`,
        { direction: "top", offset: [0, -8] },
      );

      marker.on("click", () => setSelectedStoreId(store.id));
      marker.addTo(map);
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [map, stores, setSelectedStoreId]);

  return null;
}
