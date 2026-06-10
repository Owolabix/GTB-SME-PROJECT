import { useId } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DmTrendDay } from "@/lib/dmTrend";
import { trendAxisInterval } from "@/lib/dmTrend";

const chartConfig = {
  sent: {
    label: "DMs sent",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function DmTrendChart({
  data,
  title,
  description,
  actions,
}: {
  data: DmTrendDay[];
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <div className="app-panel flex h-full flex-col rounded-2xl border p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>
      <ChartContainer config={chartConfig} className="mt-4 h-[220px] w-full aspect-auto">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={trendAxisInterval(data.length)}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={32} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.78 0.15 48)" />
              <stop offset="100%" stopColor="oklch(0.62 0.19 42)" />
            </linearGradient>
          </defs>
          <Bar
            dataKey="sent"
            fill={`url(#${gradientId})`}
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
