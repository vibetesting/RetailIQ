"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Store } from "@/types";

interface StoreMarkersProps {
  stores: Store[];
}

export default function StoreMarkers({ stores }: StoreMarkersProps) {
  const map = useMap();

  useEffect(() => {
    const markers: L.CircleMarker[] = [];

    stores.forEach((store) => {
      const marker = L.circleMarker([store.latitude, store.longitude], {
        radius: 5,
        fillColor: "#f59e0b",
        color: "#ffffff",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9,
      });

      const rating = store.avg_rating ? `⭐ ${store.avg_rating.toFixed(1)}` : "No rating";
      const reviews = store.reviews_count ? `${store.reviews_count} reviews` : "";

      marker.bindPopup(`
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${store.store_name}</div>
          <div style="color: #6b7280; font-size: 12px;">${store.city ?? ""}${store.state ? `, ${store.state}` : ""}</div>
          <div style="margin-top: 6px; font-size: 13px;">${rating} ${reviews ? `· ${reviews}` : ""}</div>
        </div>
      `);

      marker.addTo(map);
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [map, stores]);

  return null;
}
