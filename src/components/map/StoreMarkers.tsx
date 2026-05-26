"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Store } from "@/types";

interface StoreMarkersProps {
  stores: Store[];
}

function starRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export default function StoreMarkers({ stores }: StoreMarkersProps) {
  const map = useMap();

  useEffect(() => {
    const markers: L.CircleMarker[] = [];

    stores.forEach((store) => {
      const marker = L.circleMarker([store.latitude, store.longitude], {
        radius: 6,
        fillColor: "#f59e0b",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.92,
        className: "store-marker",
      });

      const location = [store.city, store.state].filter(Boolean).join(", ");
      const hasRating = store.avg_rating != null;
      const ratingColor = hasRating
        ? store.avg_rating! >= 4 ? "#16a34a" : store.avg_rating! >= 3 ? "#d97706" : "#dc2626"
        : "#9ca3af";

      marker.bindPopup(
        `<div style="font-family:-apple-system,system-ui,sans-serif;min-width:190px;padding:0;">
          <div style="padding:12px 14px 10px;">
            <div style="font-weight:700;font-size:14px;color:#111827;line-height:1.3;margin-bottom:4px;">${store.store_name}</div>
            ${location ? `<div style="font-size:12px;color:#6b7280;display:flex;align-items:center;gap:4px;">
              <svg width="11" height="11" fill="none" stroke="#9ca3af" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              ${location}
            </div>` : ""}
          </div>
          <div style="border-top:1px solid #f3f4f6;padding:10px 14px;display:flex;align-items:center;gap:10px;">
            ${hasRating ? `
              <div>
                <div style="font-size:13px;color:${ratingColor};font-weight:700;letter-spacing:-0.5px;">${store.avg_rating!.toFixed(1)}</div>
                <div style="font-size:10px;color:#d97706;letter-spacing:1px;">${starRating(store.avg_rating!)}</div>
              </div>` : `<div style="font-size:12px;color:#9ca3af;">No rating</div>`}
            ${store.reviews_count ? `
              <div style="border-left:1px solid #e5e7eb;padding-left:10px;">
                <div style="font-size:13px;font-weight:600;color:#374151;">${store.reviews_count.toLocaleString()}</div>
                <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">reviews</div>
              </div>` : ""}
          </div>
        </div>`,
        { maxWidth: 240, className: "store-popup" }
      );

      marker.addTo(map);
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [map, stores]);

  return null;
}
