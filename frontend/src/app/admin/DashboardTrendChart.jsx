"use client";

import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/line-charts-1";

const SERIES = [
  { key: "users", label: "Akun baru", color: "#155eef" },
  { key: "events", label: "Pendaftaran Event", color: "#0e9384" },
  { key: "oprec", label: "Pendaftaran OPREC", color: "#7a5af8" },
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
  const total = rows.reduce((sum, row) => sum + row[seriesKey], 0);
  const chartConfig = { [seriesKey]: { label: series.label, color: series.color } };

  return (
    <div className="admin-card">
      <div className="admin-card-header flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tren Pendaftaran</h2>
          <p className="text-xs text-slate-500">
            {loading ? "Memuat data..." : <><span className="font-semibold text-slate-800">{total}</span> {series.label.toLowerCase()} dalam {range} hari terakhir</>}
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

      <div className="flex flex-wrap gap-2 px-5 pt-4" role="tablist" aria-label="Pilih data">
        {SERIES.map((item) => (
          <button key={item.key} type="button" role="tab" aria-selected={seriesKey === item.key} onClick={() => setSeriesKey(item.key)}
            className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-semibold transition-colors ${seriesKey === item.key ? "border-slate-900 bg-slate-50 text-slate-900" : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"}`}>
            <span className="size-2.5 rounded-full" style={{ background: item.color }} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-2.5 pb-4 pt-2">
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
