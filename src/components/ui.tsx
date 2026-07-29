import type { ReactNode } from "react";
import { TrendingUp, Minus } from "lucide-react";
import type { TrendDirection } from "../lib/types";

/** Standard card container matching the dark-forest design system. */
export function Card({
  children,
  className = "",
  gradient = false,
}: {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-border p-5 ${
        gradient ? "bg-gradient-to-br from-bg-card to-bg-card-hover" : "bg-bg-card"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Uppercase mono section label (e.g. "PROGRESS TREND"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
      {children}
    </div>
  );
}

/** Barlow-condensed card heading. */
export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-heading text-lg text-text-primary">{children}</h2>;
}

/** Mono pill badge (e.g. "#9 · Striker"). */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "red" | "gold" | "green";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-bg-primary border border-border text-text-secondary",
    red: "bg-accent-red/20 text-[#E58F86]",
    gold: "bg-accent-gold/20 text-accent-gold",
    green: "bg-accent-green/20 text-[#8FC7FF]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Coloured trend arrow. */
export function TrendArrow({ trend, size = 14 }: { trend: TrendDirection; size?: number }) {
  const color = trend === "up" ? "#4DA3FF" : trend === "down" ? "#D65A4E" : "#B9C6BE";
  if (trend === "flat") return <Minus size={size} style={{ color }} />;
  return (
    <TrendingUp
      size={size}
      style={{ color, transform: trend === "down" ? "scaleY(-1)" : "none" }}
    />
  );
}

/** Simple labelled progress bar (attendance, etc.). */
export function ProgressBar({
  value,
  max,
  color = "#4DA3FF",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-primary">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
