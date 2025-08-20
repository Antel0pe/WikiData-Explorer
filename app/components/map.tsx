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
          <div class="map-popup-body">
            <div class="map-popup-title">${p.label ?? "Untitled"}</div>
            ${p.when ? `<div class=\"map-popup-date\">${new Date(p.when).toDateString()}\</div>` : ""}
            ${p.article ? `<a class=\"map-popup-link\" href=\"${p.article}\" target=\"_blank\" rel=\"noopener noreferrer\">Open Wikipedia</a>` : ""}
          </div>
        `;

        const popup = L.popup({
          className: "map-popup",
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
          maxWidth: 320,
        }).setContent(popupHtml);

        circle.bindPopup(popup);

        let closeTimeout: number | null = null;

        const scheduleClose = () => {
          if (closeTimeout) window.clearTimeout(closeTimeout);
          closeTimeout = window.setTimeout(() => {
            if (circle.isPopupOpen()) circle.closePopup();
          }, 200);
        };

        const cancelClose = () => {
          if (closeTimeout) {
            window.clearTimeout(closeTimeout);
            closeTimeout = null;
          }
        };

        circle.on("mouseover", () => {
          cancelClose();
          circle.openPopup();
        });
        circle.on("mouseout", () => {
          scheduleClose();
        });
        circle.on("click", () => {
          cancelClose();
          circle.openPopup();
        });

        circle.on("popupopen", () => {
          const el = circle.getPopup()?.getElement();
          if (!el) return;
          el.addEventListener("mouseenter", cancelClose);
          el.addEventListener("mouseleave", scheduleClose);
        });
        circle.on("popupclose", () => {
          const el = circle.getPopup()?.getElement();
          if (!el) return;
          el.removeEventListener("mouseenter", cancelClose);
          el.removeEventListener("mouseleave", scheduleClose);
        });

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


