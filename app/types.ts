export type Bounds = {
  lonW: number;
  latS: number;
  lonE: number;
  latN: number;
};

export type SparqlRow = {
  item: { value: string };
  itemLabel?: { value?: string };
  coord: { value: string };
  when?: { value?: string };
  article?: { value?: string };
};

export type WikidataResultRow = {
  id: string;
  label?: string;
  coord: string; // WKT "Point(lon lat)"
  when?: string;
  article?: string;
};


