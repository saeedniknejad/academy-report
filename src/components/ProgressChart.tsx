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
  const chartData = data.map((point) => ({
      ...point,
      value: point.value > 5 ? point.value / 20 : point.value,
  }));
  return (
     <div className="rounded-xl p-3"
     style={{ border: "1px solid #3A5275"}}>
      <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 18, bottom: 28 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A3E5C" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{
            fill: "#8FA396",
            fontSize: 11,
            fontFamily: "IBM Plex Mono",
          }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Month",
            position: "insideBottom",
            offset: -18,
            fill: "#8FA396",
            fontSize: 11,
            fontFamily: "IBM Plex Mono",
          }}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={42}
          tick={{
            fill: "#8FA396",
            fontSize: 11,
            fontFamily: "IBM Plex Mono",
          }}
          label={{
            value: "Score",
            angle: -90,
            position: "insideLeft",
            offset: 2,
            fill: "#8FA396",
            fontSize: 11,
            fontFamily: "IBM Plex Mono",
          }}
        />
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
          formatter={(v: number) => [`${Number(v).toFixed(1)}/5`, "Overall"]}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
   </div>
  );
}
