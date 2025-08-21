type Era = "AD" | "BC";

type SidebarProps = {
  startYear: number;
  endYear: number;
  onChange: (next: { startYear?: number; endYear?: number }) => void;
};

function parseYearInput(input: string): number {
  const cleaned = input.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toSignedYear(year: number, era: Era): number {
  if (era === "BC") return -Math.abs(year);
  return Math.abs(year);
}

export default function Sidebar({ startYear, endYear, onChange }: SidebarProps) {
  // Derive current era from signed value
  const startEra: Era = startYear < 0 ? "BC" : "AD";
  const endEra: Era = endYear < 0 ? "BC" : "AD";

  return (
    <aside className="w-full h-full bg-neutral-900 text-white p-4 space-y-4">
      <h2 className="text-xl font-semibold">Sidebar</h2>

      <div className="space-y-2">
        <label className="block text-sm text-neutral-300">Start Year</label>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            pattern="[0-9,]*"
            className="flex-1 rounded bg-neutral-800 text-white p-2 outline-none focus:ring-2 focus:ring-neutral-600"
            value={Math.abs(startYear).toLocaleString()}
            onChange={(e) => {
              const yr = parseYearInput(e.target.value);
              onChange({ startYear: toSignedYear(yr, startEra) });
            }}
          />
          <select
            className="rounded bg-neutral-800 text-white px-2 py-2"
            value={startEra}
            onChange={(e) => {
              const era = e.target.value as Era;
              onChange({ startYear: toSignedYear(Math.abs(startYear), era) });
            }}
          >
            <option value="AD">AD</option>
            <option value="BC">BC</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-neutral-300">End Year</label>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            pattern="[0-9,]*"
            className="flex-1 rounded bg-neutral-800 text-white p-2 outline-none focus:ring-2 focus:ring-neutral-600"
            value={Math.abs(endYear).toLocaleString()}
            onChange={(e) => {
              const yr = parseYearInput(e.target.value);
              onChange({ endYear: toSignedYear(yr, endEra) });
            }}
          />
          <select
            className="rounded bg-neutral-800 text-white px-2 py-2"
            value={endEra}
            onChange={(e) => {
              const era = e.target.value as Era;
              onChange({ endYear: toSignedYear(Math.abs(endYear), era) });
            }}
          >
            <option value="AD">AD</option>
            <option value="BC">BC</option>
          </select>
        </div>
      </div>
    </aside>
  );
}


