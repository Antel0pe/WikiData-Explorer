"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./components/Sidebar";
import type { Bounds, SparqlRow, WikidataResultRow } from "./types";

const Map = dynamic(() => import("./components/map"), { ssr: false });

async function queryWikidata(
  lonW: number,
  latS: number,
  lonE: number,
  latN: number,
  yearStart: number,
  yearEnd: number
) {
  const sparql = `
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    PREFIX bd: <http://www.bigdata.com/rdf#>
    PREFIX geo: <http://www.opengis.net/ont/geosparql#>
    PREFIX schema: <http://schema.org/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?item ?itemLabel ?coord ?when ?article WHERE {
      SERVICE wikibase:box {
        ?item wdt:P625 ?coord .
        bd:serviceParam wikibase:cornerWest "Point(${lonW} ${latS})"^^geo:wktLiteral ;
                         wikibase:cornerEast "Point(${lonE} ${latN})"^^geo:wktLiteral .
      }
      ?item wdt:P585 ?when .
      FILTER(
        ?when >= "${yearStart}-01-01T00:00:00Z"^^xsd:dateTime &&
        ?when <  "${yearEnd}-01-01T00:00:00Z"^^xsd:dateTime
      )

      OPTIONAL {
        ?article schema:about ?item ;
                 schema:inLanguage "en" ;
                 schema:isPartOf <https://en.wikipedia.org/> .
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 200
  `;

  const response = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json"
    },
    body: sparql,
  });

  const data = await response.json();
  return (data.results.bindings as SparqlRow[]).map((row): WikidataResultRow => ({
    id: row.item.value,
    label: row.itemLabel?.value,
    coord: row.coord.value,
    when: row.when?.value,
    article: row.article?.value,
  }));
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
