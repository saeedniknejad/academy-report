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
  color = "#F2A93B",
}: ProgressChartProps) {
  const normalizedData = data.map((point) => ({
      ...point,
      value: point.value > 5 ? point.value / 20 : point.value,
    }));

    const minimumSlots = 6;

    const chartData = [
      ...normalizedData,
      ...Array.from(
        { length: Math.max(0, minimumSlots - normalizedData.length) },
        (_, index) => ({
          month: `empty-${index}`,
          value: null,
        })
      ),
    ];
  return (
     <div className="rounded-xl p-3"
     style={{ border: "1px solid #3A5275"}}>
      <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 28 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#566F93" strokeWidth={1} vertical={false}
        />
        <XAxis
          xAxisId={"bottom"}
          dataKey="month"
          tickFormatter={(value) => String(value).startsWith("empty-") ? "" : String(value)}
          tick={{
            fill: "#8FA396",
            fontSize: 11,
            fontFamily: "IBM Plex Mono",
          }}
          axisLine={{ stroke: "#566F93", strokeWidth: 1.4 }}
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
        <XAxis
          xAxisId="top"
          orientation="top"
          dataKey="month"
          tick={false}
          tickLine={false}
          axisLine={{ stroke: "#566F93", strokeWidth: 1.4 }}
          height={1}
        />
        <YAxis
          yAxisId={"left"}
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          allowDecimals={false}
          axisLine={{ stroke: "#566F93", strokeWidth: 1.4 }}
          tickLine={true}
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
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[1, 5]}
          tick={false}
          tickLine={false}
          axisLine={{ stroke: "#566F93", strokeWidth: 1.4 }}
          width={1}
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
        <Bar xAxisId="bottom" yAxisId="left" dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
   </div>
  );
}
