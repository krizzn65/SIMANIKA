import "server-only";
import { cache } from "react";
import { eventFilters, normalizeEvent } from "@/lib/events";

const PAGE_SIZE = 9;

async function requestEvents(path, query) {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  if (!base) return { kind: "unconfigured" };
  const url = new URL(`${base.replace(/\/+$/, "")}/public/events${path}`);
  if (query) url.search = query.toString();
  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return { kind: "unavailable" };
  }
  if (response.status === 404 && path) return { kind: "not-found" };
  if (!response.ok) return { kind: "unavailable" };
  return { kind: "ready", body: await response.json() };
}

export async function getEvents(params = {}) {
  const filters = eventFilters(params);
  const query = new URLSearchParams({ page: String(filters.page), per_page: String(PAGE_SIZE) });
  for (const key of ["search", "kategori", "status"]) if (filters[key]) query.set(key, filters[key]);
  const response = await requestEvents("", query);
  if (response.kind !== "ready") return { events: [], total: 0, currentPage: 1, lastPage: 1, configured: response.kind !== "unconfigured", unavailable: response.kind === "unavailable" };
  const { data, meta } = response.body;
  if (!Array.isArray(data) || !meta || !Number.isSafeInteger(meta.total) || meta.total < 0 ||
    !Number.isSafeInteger(meta.last_page) || meta.last_page < 1 ||
    !Number.isSafeInteger(meta.current_page) || meta.current_page < 1) {
    throw new Error("Invalid event collection response");
  }
  const events = data.map(normalizeEvent);
  // Reject a malformed collection rather than silently showing misleading counts.
  if (events.some((event) => !event) || events.length > PAGE_SIZE) throw new Error("Invalid public event data");
  return { events, total: meta.total, currentPage: meta.current_page, lastPage: meta.last_page, configured: true };
}

export const getEvent = cache(async (slug) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const response = await requestEvents(`/${encodeURIComponent(slug)}`);
  if (response.kind !== "ready") return null;
  const event = normalizeEvent(response.body.data);
  if (response.body.data?.status === "draft") return null;
  if (!event) throw new Error("Invalid event detail response");
  return event;
});
