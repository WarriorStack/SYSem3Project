import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
  info: "var(--info)",
};

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
} as const;

type Row = Record<string, unknown>;

export function TrendChart({
  data,
  xKey,
  series,
  height = 260,
  area = true,
}: {
  data: Row[];
  xKey: string;
  series: Array<{ key: string; label: string; color?: string }>;
  height?: number | undefined;
  area?: boolean | undefined;
}) {
  const Chart = area ? AreaChart : LineChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) =>
          area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              fill={`url(#grad-${s.key})`}
              strokeWidth={2}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({
  data,
  xKey,
  yKey,
  height = 260,
  horizontal = false,
  colorByIndex = true,
}: {
  data: Row[];
  xKey: string;
  yKey: string;
  height?: number | undefined;
  horizontal?: boolean | undefined;
  colorByIndex?: boolean | undefined;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 16, left: horizontal ? 24 : -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={!horizontal} horizontal={horizontal} />
        {horizontal && <XAxis type="number" {...axisProps} allowDecimals={false} />}
        {horizontal && <YAxis type="category" dataKey={xKey} width={120} {...axisProps} />}
        {!horizontal && (
          <XAxis dataKey={xKey} {...axisProps} interval={0} angle={-15} textAnchor="end" height={50} />
        )}
        {!horizontal && <YAxis {...axisProps} allowDecimals={false} />}

        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)", opacity: 0.3 }} />
        <Bar dataKey={yKey} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} fill="var(--chart-1)">
          {colorByIndex &&
            data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  nameKey,
  valueKey,
  height = 260,
  colors,
}: {
  data: Row[];
  nameKey: string;
  valueKey: string;
  height?: number | undefined;
  colors?: string[] | undefined;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="var(--card)"
        >
          {data.map((row, i) => (
            <Cell
              key={i}
              fill={
                colors?.[i] ??
                SEVERITY_COLORS[String(row[nameKey] ?? "").toLowerCase()] ??
                CHART_COLORS[i % CHART_COLORS.length]
              }
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
