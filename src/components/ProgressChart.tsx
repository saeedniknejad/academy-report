import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { MonthlyPoint } from "../lib/types";

interface ProgressChartProps {
  data: MonthlyPoint[];
  height?: number;
  color?: string;
}

/** Monthly overall-score bar chart used in both coach and parent views. */
export default function ProgressChart({
  data,
  height = 140,
  color = "#4DA3FF",
}: ProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A3E5C" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#8FA396", fontSize: 11, fontFamily: "IBM Plex Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, 100]} />
        <Tooltip
          cursor={{ fill: "#1C2E4A" }}
          contentStyle={{
            background: "#0A1729",
            border: "1px solid #2A3E5C",
            borderRadius: 8,
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            color: "#EEF1EC",
          }}
          labelStyle={{ color: "#8FA396" }}
          formatter={(v: number) => [`${v}/100`, "Overall"]}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}
