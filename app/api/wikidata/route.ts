export const runtime = "nodejs";
import type { SparqlRow, WikidataResultRow } from "@/app/types";

type Params = {
  lonW: number;
  latS: number;
  lonE: number;
  latN: number;
  yearStart: number;
  yearEnd: number;
};

export async function POST(req: Request) {
  try {
    const { lonW, latS, lonE, latN, yearStart, yearEnd } = (await req.json()) as Params;

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

    const wdqs = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        Accept: "application/sparql-results+json",
        "User-Agent": "WikiData-Explorer/0.1 (contact: dev-local)",
      },
      body: sparql,
      // Avoid caching to reflect immediate changes
      cache: "no-store",
    });

    if (!wdqs.ok) {
      return Response.json(
        { error: "Upstream error", status: wdqs.status, statusText: wdqs.statusText },
        { status: wdqs.status }
      );
    }

    const data: { results: { bindings: SparqlRow[] } } = await wdqs.json();
    const rows: WikidataResultRow[] = data.results.bindings.map((row) => ({
      id: row.item.value,
      label: row.itemLabel?.value,
      coord: row.coord.value,
      when: row.when?.value,
      article: row.article?.value,
    }));

    return Response.json({ rows }, { status: 200 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}


