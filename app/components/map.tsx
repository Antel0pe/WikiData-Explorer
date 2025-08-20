"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LatLngBounds } from "leaflet";
import type { Bounds } from "../types";

type MapProps = {
  onBoundsChange?: (bounds: Bounds) => void;
};

export default function Map({ onBoundsChange }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

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

  return (
    <div className="w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}


