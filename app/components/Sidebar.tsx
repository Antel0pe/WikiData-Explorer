type SidebarProps = {
  startYear: number;
  endYear: number;
  onChange: (next: { startYear?: number; endYear?: number }) => void;
};

export default function Sidebar({ startYear, endYear, onChange }: SidebarProps) {
  return (
    <aside className="w-full h-full bg-neutral-900 text-white p-4 space-y-4">
      <h2 className="text-xl font-semibold">Sidebar</h2>
      <div className="space-y-2">
        <label className="block text-sm text-neutral-300">Start Year</label>
        <input
          type="number"
          className="w-full rounded bg-neutral-800 text-white p-2 outline-none focus:ring-2 focus:ring-neutral-600"
          value={startYear}
          onChange={(e) => onChange({ startYear: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-neutral-300">End Year</label>
        <input
          type="number"
          className="w-full rounded bg-neutral-800 text-white p-2 outline-none focus:ring-2 focus:ring-neutral-600"
          value={endYear}
          onChange={(e) => onChange({ endYear: Number(e.target.value) })}
        />
      </div>
    </aside>
  );
}


