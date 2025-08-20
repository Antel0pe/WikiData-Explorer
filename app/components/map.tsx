"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LatLngBounds } from "leaflet";
import type { Bounds, ArticlePoint } from "../types";

type MapProps = {
  onBoundsChange?: (bounds: Bounds) => void;
  points?: ArticlePoint[];
};

export default function Map({ onBoundsChange, points = [] }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const L = (await import("leaflet")).default;
      if (!mapContainerRef.current || !isMounted) return;

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        worldCopyJump: true,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);

      const emitBounds = (b: LatLngBounds) => {
        if (!onBoundsChange) return;
        onBoundsChange({
          lonW: b.getWest(),
          latS: b.getSouth(),
          lonE: b.getEast(),
          latN: b.getNorth(),
        });
      };

      emitBounds(mapInstanceRef.current.getBounds());

      mapInstanceRef.current.on("moveend", () => {
        if (!mapInstanceRef.current) return;
        emitBounds(mapInstanceRef.current.getBounds());
      });
      mapInstanceRef.current.on("zoomend", () => {
        if (!mapInstanceRef.current) return;
        emitBounds(mapInstanceRef.current.getBounds());
      });
    };

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onBoundsChange]);

  useEffect(() => {
    const updateMarkers = async () => {
      const L = (await import("leaflet")).default;
      if (!mapInstanceRef.current) return;

      if (!markersLayerRef.current) {
        markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      }
      markersLayerRef.current.clearLayers();

      points.forEach((p) => {
        const circle = L.circleMarker([p.lat, p.lng], {
          radius: 6,
          color: p.color,
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
          fillColor: p.color,
        });

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #e5e5e5; background: #111827; padding: 10px; border-radius: 8px; max-width: 260px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${p.label ?? "Untitled"}</div>
            ${p.when ? `<div style=\"font-size:12px;color:#a3a3a3;margin-bottom:8px;\">${new Date(p.when).toDateString()}\</div>` : ""}
            ${p.article ? `<a href=\"${p.article}\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:inline-block;background:#1f2937;color:white;padding:6px 10px;border-radius:6px;text-decoration:none;\">Open Wikipedia</a>` : ""}
          </div>
        `;

        circle.bindTooltip(popupHtml, { direction: "top", sticky: true, opacity: 1, className: "" });
        circle.addTo(markersLayerRef.current!);
      });
    };

    updateMarkers();
  }, [points]);

  return (
    <div className="w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}


