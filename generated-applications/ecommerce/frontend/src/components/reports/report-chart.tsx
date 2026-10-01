/**
 * The chart a report declares: `chart: bar | line | area | pie`, plotting the
 * result column named by `x` against the one named by `y`.
 *
 * Plain SVG rather than a charting library. Four chart types over one series
 * is the whole requirement, and a library would be a dependency in every
 * generated application for a screen many models never use. Colour comes from
 * the theme through `currentColor`, so the chart follows the theme selector
 * like everything else on the page.
 */

import { useMemo } from "react";

import type { ReportChart as ChartKind } from "@/hooks/use-reports";

interface ReportChartProps {
  kind: ChartKind;
  rows: Record<string, unknown>[];
  x: string;
  y: string;
}

interface Point {
  label: string;
  value: number;
}

const WIDTH = 760;
const HEIGHT = 320;
const MARGIN = { top: 16, right: 16, bottom: 56, left: 64 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

/** Slice colours for a pie. Categorical, so they are fixed rather than themed. */
const SLICE_CLASSES = [
  "text-sky-600",
  "text-emerald-600",
  "text-amber-500",
  "text-rose-600",
  "text-violet-600",
  "text-teal-600",
  "text-orange-600",
  "text-indigo-600",
  "text-lime-600",
  "text-fuchsia-600",
];

/** More rows than this and a chart stops being readable; the table has them all. */
const MAX_POINTS = 60;

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** A tick step of 1, 2 or 5 × 10ⁿ giving about five ticks up to `max`. */
function niceStep(max: number): number {
  if (max <= 0) return 1;
  const raw = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const factor = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return factor * magnitude;
}

function truncateLabel(label: string, length = 14): string {
  return label.length > length ? `${label.slice(0, length - 1)}…` : label;
}

export function ReportChart({ kind, rows, x, y }: ReportChartProps) {
  const points = useMemo<Point[]>(
    () =>
      rows.slice(0, MAX_POINTS).flatMap((row) => {
        const value = toNumber(row[y]);
        if (value === null) return [];
        const raw = row[x];
        return [{ label: raw === null || raw === undefined ? "—" : String(raw), value }];
      }),
    [rows, x, y]
  );

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No row has a number in <code>{y}</code> to plot.
      </p>
    );
  }

  // Axes over nothing but zeros read as a chart that failed to draw.
  if (points.every((p) => p.value === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        Every row has 0 in <code>{y}</code>, so there is nothing to plot yet. The rows are below.
      </p>
    );
  }

  const omitted = Math.min(rows.length, MAX_POINTS) < rows.length;
  const caption = omitted ? `First ${MAX_POINTS} of ${rows.length} rows.` : null;

  return (
    <figure className="w-full overflow-x-auto">
      {kind === "pie" ? <Pie points={points} /> : <Cartesian kind={kind} points={points} x={x} y={y} />}
      {caption && <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

function Cartesian({
  kind,
  points,
  x,
  y,
}: {
  kind: Exclude<ChartKind, "pie">;
  points: Point[];
  x: string;
  y: string;
}) {
  const low = Math.min(0, ...points.map((p) => p.value));
  const high = Math.max(0, ...points.map((p) => p.value));
  // Counts are whole numbers, and an axis reading 0.2, 0.4 … over them invents
  // precision the data does not have.
  const whole = points.every((p) => Number.isInteger(p.value));
  const rawStep = niceStep(Math.max(Math.abs(high), Math.abs(low)));
  const step = whole ? Math.max(1, Math.round(rawStep)) : rawStep;
  const top = Math.ceil(high / step) * step || step;
  const bottom = Math.floor(low / step) * step;
  const span = top - bottom;
  const scaleY = (value: number) => MARGIN.top + PLOT_H - ((value - bottom) / span) * PLOT_H;
  const band = PLOT_W / points.length;
  const centre = (index: number) => MARGIN.left + band * index + band / 2;

  const ticks: number[] = [];
  for (let tick = bottom; tick <= top + step / 2; tick += step) ticks.push(tick);

  const line = points.map((p, i) => `${centre(i)},${scaleY(p.value)}`).join(" ");
  const area = `${centre(0)},${scaleY(0)} ${line} ${centre(points.length - 1)},${scaleY(0)}`;
  const everyNth = Math.ceil(points.length / 12);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${kind} chart of ${y} by ${x}`}
      className="h-auto w-full min-w-[480px]"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={scaleY(tick)}
            y2={scaleY(tick)}
            className="stroke-muted-foreground/20"
          />
          <text
            x={MARGIN.left - 8}
            y={scaleY(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {numberFormat.format(tick)}
          </text>
        </g>
      ))}

      <g className="text-primary">
        {kind === "bar" &&
          points.map((p, i) => {
            const zero = scaleY(0);
            const value = scaleY(p.value);
            return (
              <rect
                key={`${p.label}-${i}`}
                x={centre(i) - (band * 0.7) / 2}
                width={band * 0.7}
                y={Math.min(zero, value)}
                height={Math.max(1, Math.abs(zero - value))}
                rx={2}
                fill="currentColor"
              >
                <title>{`${p.label}: ${numberFormat.format(p.value)}`}</title>
              </rect>
            );
          })}
        {kind === "area" && <polygon points={area} fill="currentColor" fillOpacity={0.18} />}
        {(kind === "line" || kind === "area") && (
          <>
            <polyline points={line} fill="none" stroke="currentColor" strokeWidth={2} />
            {points.map((p, i) => (
              <circle key={`${p.label}-${i}`} cx={centre(i)} cy={scaleY(p.value)} r={3} fill="currentColor">
                <title>{`${p.label}: ${numberFormat.format(p.value)}`}</title>
              </circle>
            ))}
          </>
        )}
      </g>

      {points.map((p, i) =>
        i % everyNth === 0 ? (
          <text
            key={`${p.label}-${i}`}
            x={centre(i)}
            y={HEIGHT - MARGIN.bottom + 16}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px]"
          >
            {truncateLabel(p.label)}
          </text>
        ) : null
      )}
      <text
        x={MARGIN.left + PLOT_W / 2}
        y={HEIGHT - 8}
        textAnchor="middle"
        className="fill-foreground text-xs font-medium"
      >
        {x}
      </text>
    </svg>
  );
}

function Pie({ points }: { points: Point[] }) {
  const positive = points.filter((p) => p.value > 0);
  const total = positive.reduce((sum, p) => sum + p.value, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Every value is zero; there is nothing to divide.</p>;
  }

  const radius = 120;
  const cx = 150;
  const cy = 150;
  let angle = -Math.PI / 2;
  const slices = positive.map((p, index) => {
    const sweep = (p.value / total) * Math.PI * 2;
    const start = angle;
    angle += sweep;
    const end = angle;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    // A single slice is a full circle, which an arc from a point to itself
    // cannot draw.
    const d =
      positive.length === 1
        ? `M ${cx - radius} ${cy} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...p, d, colour: SLICE_CLASSES[index % SLICE_CLASSES.length] ?? "text-primary" };
  });

  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox="0 0 300 300" role="img" aria-label="Pie chart" className="h-72 w-72 shrink-0">
        {slices.map((slice, i) => (
          <path key={`${slice.label}-${i}`} d={slice.d} fill="currentColor" className={slice.colour}>
            <title>{`${slice.label}: ${numberFormat.format(slice.value)}`}</title>
          </path>
        ))}
      </svg>
      <ul className="space-y-1 text-sm">
        {slices.map((slice, i) => (
          <li key={`${slice.label}-${i}`} className="flex items-center gap-2">
            <svg viewBox="0 0 10 10" className={`h-3 w-3 ${slice.colour}`} aria-hidden="true">
              <rect width="10" height="10" rx="2" fill="currentColor" />
            </svg>
            <span className="font-medium">{slice.label}</span>
            <span className="text-muted-foreground">
              {numberFormat.format(slice.value)} ({Math.round((slice.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
