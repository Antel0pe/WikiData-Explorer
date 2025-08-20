"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

type TimelineProps = {
  startYear: number;
  endYear: number;
  onChange: (next: { startYear?: number; endYear?: number }) => void;
};

const PRESENT_YEAR = 2025;
const MAX_AGE = 1_000_000_000; // years into the past
const EXPONENT = 4; // higher => more detail near present

function yearToU(year: number): number {
  const age = Math.max(0, Math.min(MAX_AGE, PRESENT_YEAR - year));
  return Math.pow(age / MAX_AGE, 1 / EXPONENT);
}

function uToYear(u: number): number {
  const clamped = Math.max(0, Math.min(1, u));
  const age = MAX_AGE * Math.pow(clamped, EXPONENT);
  return Math.round(PRESENT_YEAR - age);
}

function formatLabel(year: number): string {
  if (year >= 1_000_000_000) return `${(year / 1_000_000_000).toFixed(1)} By`; // shouldn't happen for CE
  if (year >= 1_000_000) return `${Math.round(year / 1_000_000)} My`;
  if (year >= 1_000) return `${Math.round(year / 1_000)} ky`;
  return `${year}`;
}

function formatYearReadable(y: number): string {
  if (y >= 1) return `${y}`;
  const age = PRESENT_YEAR - y;
  if (age >= 1_000_000_000) return `${Math.round(age / 1_000_000_000)}bya`;
  if (age >= 1_000_000) return `${Math.round(age / 1_000_000)}mya`;
  if (age >= 1_000) return `${Math.round(age / 1_000)}kya`;
  return `${Math.round(age)}ya`;
}

export default function Timeline({ startYear, endYear, onChange }: TimelineProps) {
  // Convert years to slider coordinates, with 0 = far past (left), 1 = present (right)
  const valueX = useMemo<[number, number]>(
    () => {
      const x0 = 1 - yearToU(startYear);
      const x1 = 1 - yearToU(endYear);
      const arr = [x0, x1].sort((a, b) => a - b) as [number, number];
      return arr;
    },
    [startYear, endYear]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingRange, setIsDraggingRange] = useState(false);
  const dragStartRef = useRef<{ u0: number; u1: number; x: number; width: number } | null>(null);

  const marks = useMemo(() => {
    const entries: Array<[number, string]> = [];
    const ages = [0, 10_000, 1_000_000, 100_000_000, 1_800_000_000];
    ages.forEach((age) => {
      const u = Math.pow(age / MAX_AGE, 1 / EXPONENT);
      const x = 1 - u; // invert so present is on the right
      const label = age === 0 ? `${PRESENT_YEAR}` : `${formatLabel(age)} ago`;
      entries.push([Number(x.toFixed(6)), label]);
    });
    return Object.fromEntries(entries);
  }, []);

  const handleChange = useCallback(
    (vals: number | number[]) => {
      const [x0, x1] = vals as number[];
      const u0 = 1 - x0;
      const u1 = 1 - x1;
      const y0 = uToYear(u0);
      const y1 = uToYear(u1);
      onChange({ startYear: Math.min(y0, y1), endYear: Math.max(y0, y1) });
    },
    [onChange]
  );

  const onRangeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = { u0: valueX[0], u1: valueX[1], x: e.clientX, width: rect.width };
    setIsDraggingRange(true);
  }, [valueX]);

  useEffect(() => {
    if (!isDraggingRange) return;
    const onMove = (e: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const deltaPx = e.clientX - start.x;
      const deltaX = deltaPx / start.width;
      const range = start.u1 - start.u0;
      let nextX0 = start.u0 + deltaX;
      nextX0 = Math.max(0, Math.min(1 - range, nextX0));
      const nextX1 = nextX0 + range;
      const y0 = uToYear(1 - nextX0);
      const y1 = uToYear(1 - nextX1);
      onChange({ startYear: Math.min(y0, y1), endYear: Math.max(y0, y1) });
    };
    const onUp = () => {
      setIsDraggingRange(false);
      dragStartRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingRange, onChange]);

  return (
    <div ref={containerRef} className="w-full h-full px-6 py-4 bg-neutral-950 text-neutral-200 relative">
      <div className="text-sm mb-2 flex items-center justify-between">
        <div className="font-semibold">Timeline</div>
        <div className="text-xs text-neutral-400">
          Range: {formatYearReadable(startYear)} → {formatYearReadable(endYear)}
        </div>
      </div>
      <div className="pt-4">
        <Slider
          range
          min={0}
          max={1}
          step={0.0001}
          value={valueX}
          onChange={handleChange}
          allowCross={false}
          marks={marks}
          className="dark-rc-slider"
          styles={{
            track: { backgroundColor: "#2563eb", height: 6 },
            rail: { backgroundColor: "#1f2937", height: 6 },
            handle: {
              borderColor: "#60a5fa",
              backgroundColor: "#111827",
              boxShadow: "0 0 0 4px rgba(96, 165, 250, 0.35)",
              width: 16,
              height: 16,
              marginTop: -5,
            },
          }}
        />
        <div
          onMouseDown={onRangeMouseDown}
          className={`absolute left-0 right-0`}
          style={{
            left: `${valueX[0] * 100}%`,
            width: `${(valueX[1] - valueX[0]) * 100}%`,
            top: "52px",
            height: "16px",
            cursor: isDraggingRange ? "grabbing" as const : "grab" as const,
          }}
        />
      </div>
    </div>
  );
}


