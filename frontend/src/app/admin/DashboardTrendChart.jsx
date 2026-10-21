"use client";

import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/line-charts-1";

const SERIES = [
  { key: "users", label: "Akun baru", short: "Akun", color: "#155eef" },
  { key: "events", label: "Pendaftaran Event", short: "Event", color: "#0e9384" },
  { key: "oprec", label: "Pendaftaran OPREC", short: "OPREC", color: "#7a5af8" },
];
const RANGES = [7, 30, 90];

const dayLabel = (date, long = false) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", long ? { weekday: "short", day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" });

function TrendTooltip({ active, payload, series }) {
  const row = active && payload?.[0]?.payload;
  if (!row) return null;
  return (
    <div className="min-w-[170px] border border-slate-200 bg-white px-3 py-2.5 shadow-md">
      <div className="mb-1.5 text-[11px] font-medium text-slate-500">{dayLabel(row.date, true)}</div>
      <div className="flex items-center gap-2 text-xs">
        <span className="size-2.5 rounded-full" style={{ background: series.color }} aria-hidden="true" />
        <span className="text-slate-600">{series.label}:</span>
        <span className="font-semibold text-slate-900">{row[series.key]}</span>
      </div>
    </div>
  );
}

export function DashboardTrendChart({ trends, loading }) {
  const [seriesKey, setSeriesKey] = useState("users");
  const [range, setRange] = useState(30);
  const series = SERIES.find((item) => item.key === seriesKey);

  const rows = useMemo(() => (trends || []).slice(-range), [trends, range]);
  const chartConfig = { [seriesKey]: { label: series.label, color: series.color } };

  return (
    <div className="admin-card">
      <div className="admin-card-header flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tren Pendaftaran</h2>
          <p className="text-xs text-slate-500">
            Jumlah pendaftaran per hari, {range} hari terakhir (WIB)
          </p>
        </div>
        <div className="flex border border-slate-200" role="group" aria-label="Rentang waktu">
          {RANGES.map((days) => (
            <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)}
              className={`px-3 py-1.5 text-xs font-semibold ${range === days ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              {days} hari
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pt-4 sm:gap-3 sm:px-5" role="tablist" aria-label="Pilih data">
        {SERIES.map((item) => {
          const active = seriesKey === item.key;
          const sum = rows.reduce((acc, row) => acc + row[item.key], 0);
          return (
            <button key={item.key} type="button" role="tab" aria-selected={active} onClick={() => setSeriesKey(item.key)}
              className={`flex flex-col items-start gap-1.5 border-2 px-3 py-2.5 text-left transition-colors sm:px-4 ${active ? "border-solid" : "border-dashed border-slate-300 bg-white hover:border-slate-400"}`}
              style={active ? { borderColor: item.color, background: `${item.color}0f` } : undefined}>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold sm:text-xs" style={{ color: active ? item.color : "#64748b" }}>
                <span className="size-2 shrink-0" style={{ background: item.color }} aria-hidden="true" />
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
              <span className={`text-lg font-bold leading-none sm:text-2xl ${active ? "text-slate-900" : "text-slate-400"}`}>{loading ? "–" : sum}</span>
            </button>
          );
        })}
      </div>

      <div className="px-2.5 pb-4 pt-4">
        {loading ? (
          <div className="h-[300px] animate-pulse bg-slate-50" />
        ) : (
          <ChartContainer key={`${seriesKey}-${range}`} config={chartConfig} className="h-[300px] w-full aspect-auto [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial">
            <ComposedChart data={rows} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`trend-${seriesKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={series.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={series.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickMargin={10} minTickGap={24} tickFormatter={(date) => dayLabel(date)} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} width={32} tickMargin={6} />
              <ChartTooltip content={<TrendTooltip series={series} />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
              <Area type="monotone" dataKey={seriesKey} stroke="transparent" fill={`url(#trend-${seriesKey})`} tooltipType="none" />
              <Line type="monotone" dataKey={seriesKey} stroke={series.color} strokeWidth={2}
                dot={range <= 30 ? { fill: "#fff", stroke: series.color, strokeWidth: 2, r: 3.5 } : false}
                activeDot={{ fill: "#fff", stroke: series.color, strokeWidth: 2, r: 5 }} />
            </ComposedChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
