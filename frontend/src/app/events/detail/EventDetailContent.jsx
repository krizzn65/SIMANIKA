"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EventDetailView } from "@/components/events/EventDetailView";
import { publicApi } from "@/services/publicApi";
import { normalizeEvent } from "@/lib/events";
import { EventDetailSkeleton } from "@/components/events/EventSkeletons";

export default function EventDetailContent() {
  const slug = useSearchParams().get("slug");
  const [state, setState] = useState({ loading: true, event: null, error: "" });
  useEffect(() => {
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setState({ loading: false, event: null, error: "Event tidak ditemukan." });
      return;
    }
    const controller = new AbortController();
    setState({ loading: true, event: null, error: "" });
    publicApi.get(`/public/events/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(({ data }) => {
        const event = normalizeEvent(data?.data);
        setState({ loading: false, event, error: event ? "" : "Event tidak ditemukan." });
      })
      .catch((error) => { if (!controller.signal.aborted) setState({ loading: false, event: null, error: error.response?.status === 404 ? "Event tidak ditemukan." : "Event belum bisa dimuat. Coba lagi nanti." }); });
    return () => controller.abort();
  }, [slug]);
  if (state.loading) return <EventDetailSkeleton />;
  if (!state.event) return <p className="event-container" role="alert">{state.error}</p>;
  return <EventDetailView event={state.event} />;
}
