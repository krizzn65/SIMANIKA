"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EventFilters } from "@/components/events/EventFilters";
import { EventList } from "@/components/events/EventList";
import { eventFilters, normalizeEvent } from "@/lib/events";
import { publicApi } from "@/services/publicApi";

const empty = { events: [], total: 0, currentPage: 1, lastPage: 1 };

export default function EventsContent() {
  const params = useSearchParams();
  const filters = eventFilters(Object.fromEntries(params.entries()));
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    publicApi.get("/public/events", { params: { ...filters, per_page: 9 }, signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data?.data) || !data?.meta) throw new Error("Invalid event collection");
        const events = data.data.map(normalizeEvent);
        if (events.some((event) => !event)) throw new Error("Invalid event collection");
        setResult({ events, total: data.meta.total, currentPage: data.meta.current_page, lastPage: data.meta.last_page });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ ...empty, unavailable: true }); });
    return () => controller.abort();
  }, [filters.search, filters.kategori, filters.status, filters.page]);
  return <><EventFilters filters={filters} />{result ? <EventList result={result} filters={filters} /> : <p role="status">Memuat event...</p>}</>;
}
