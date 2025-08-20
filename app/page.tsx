"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
// import Sidebar from "./components/Sidebar";
import Timeline from "./components/Timeline";
import type { Bounds, WikidataResultRow, ArticlePoint } from "./types";

const Map = dynamic(() => import("./components/map"), { ssr: false });

async function queryWikidata(
  lonW: number,
  latS: number,
  lonE: number,
  latN: number,
  yearStart: number,
  yearEnd: number
) {
  const response = await fetch("/api/wikidata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lonW, latS, lonE, latN, yearStart, yearEnd }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  return data.rows as WikidataResultRow[];
}

export default function Home() {
  const [startYear, setStartYear] = useState<number>(1900);
  const [endYear, setEndYear] = useState<number>(2000);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [points, setPoints] = useState<ArticlePoint[]>([]);

  const handleSidebarChange = useCallback((next: { startYear?: number; endYear?: number }) => {
    if (typeof next.startYear === "number") setStartYear(next.startYear);
    if (typeof next.endYear === "number") setEndYear(next.endYear);
  }, []);

  useEffect(() => {
    if (!bounds) return;
    const timeoutId = window.setTimeout(() => {
      const { lonW, latS, lonE, latN } = bounds;
      queryWikidata(lonW, latS, lonE, latN, startYear, endYear)
        .then((rows) => {
          const parsed = rows.reduce<ArticlePoint[]>((acc, r) => {
            const pair = parseWktPoint(r.coord);
            if (!pair) return acc;
            const [lng, lat] = pair;
            const color = hashColor(r.id);
            acc.push({ id: r.id, lat, lng, label: r.label, when: r.when, article: r.article, color });
            return acc;
          }, []);
          setPoints(parsed);
          console.log("Wikidata results", { rowsCount: rows.length, rows, points: parsed.length });
        })
        .catch((err) => {
          console.error("Wikidata query failed", err);
        });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bounds, startYear, endYear]);

  function parseWktPoint(wkt: string): [number, number] | null {
    // Expects "Point(lon lat)"
    if (!wkt.startsWith("Point(") || !wkt.endsWith(")")) return null;
    const [lonStr, latStr] = wkt.slice(6, -1).trim().split(/\s+/);
    const lon = Number(lonStr);
    const lat = Number(latStr);
    return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
  }

  function hashColor(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 80% 55%)`;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="h-[80vh] w-full">
        <Map onBoundsChange={setBounds} points={points} />
      </div>
      <div className="h-[20vh] w-full border-t border-neutral-800">
        <Timeline startYear={startYear} endYear={endYear} onChange={handleSidebarChange} />
      </div>
    </div>
  );
}
