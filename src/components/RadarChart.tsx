import {
  Radar,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RadarPoint } from "../lib/types";

interface Series {
  key: "value" | "season";
  name: string;
  color: string;
}

interface RadarChartProps {
  data: RadarPoint[];
  /** Primary series color. */
  color: string;
  /** When set, renders the overlay series (season avg or comparison player). */
  overlay?: { name: string; color: string };
  primaryName?: string;
  height?: number;
  showLegend?: boolean;
}

/**
 * Reusable radar with the mockup's "pitch" motif behind it: a faint centre
 * circle so the chart reads as a football graphic. Supports an optional second
 * series for season-average overlays or two-player comparison.
 */
export default function RadarChart({
  data,
  color,
  overlay,
  primaryName = "Current",
  height = 260,
  showLegend = false,
}: RadarChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    value: point.value > 5 ? point.value / 20 : point.value,
    season:
      point.season !== undefined
        ? point.season > 5
          ? point.season / 20
          : point.season
        : undefined,
  }));
  const series: Series[] = [{ key: "value", name: primaryName, color }];
  if (overlay) series.push({ key: "season", name: overlay.name, color: overlay.color });

  return (
    <div className="relative">
      {/* Pitch centre-circle backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.15]">
        <div className="h-40 w-40 rounded-full border border-text-primary" />
        <div className="absolute h-1 w-1 rounded-full bg-text-primary" />
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ReRadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="#2A3E5C" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "#B9C6BE", fontSize: 11, fontFamily: "Inter" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tickCount={6}
            allowDecimals={false}
            tickFormatter={(value) => (value === 0 ? "" : String(value))}
            tick={{
              fill: "#B9C6BE",
              fontSize: 10,
              fontFamily: "IBM Plex Mono",
            }}
            axisLine={false}
          />
          {series.map((s) => (
            <Radar
              key={s.key}
              name={s.name}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.key === "value" ? 0.35 : 0.12}
              strokeWidth={2}
              strokeDasharray={s.key === "season" && !overlay?.name.includes("vs") ? "4 3" : undefined}
            />
          ))}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#B9C6BE" }}
            />
          )}
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
