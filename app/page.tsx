"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./components/Sidebar";
import type { Bounds, WikidataResultRow } from "./types";

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

  const handleSidebarChange = useCallback((next: { startYear?: number; endYear?: number }) => {
    if (typeof next.startYear === "number") setStartYear(next.startYear);
    if (typeof next.endYear === "number") setEndYear(next.endYear);
  }, []);

  useEffect(() => {
    if (!bounds) return;
    const { lonW, latS, lonE, latN } = bounds;
    queryWikidata(lonW, latS, lonE, latN, startYear, endYear)
      .then((rows) => {
        console.log("Wikidata results", { rowsCount: rows.length, rows });
      })
      .catch((err) => {
        console.error("Wikidata query failed", err);
      });
  }, [bounds, startYear, endYear]);

  return (
    <div className="min-h-screen w-full flex">
      <div className="basis-[20%] h-screen overflow-auto">
        <Sidebar
          startYear={startYear}
          endYear={endYear}
          onChange={handleSidebarChange}
        />
      </div>
      <div className="basis-[80%] h-screen">
        <Map onBoundsChange={setBounds} />
      </div>
    </div>
  );
}
