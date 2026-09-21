import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/lib/events.js", import.meta.url), "utf8");
const { eventFilters, eventListHref, safeEventUrl, normalizeEvent, registrationState, eventDate } =
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const sample = {
  id: 1, slug: "workshop-web", judul: "Workshop Web", status: "published",
  tanggalMulai: "2026-11-20T09:00:00+07:00", tanggalSelesai: "2026-11-20T16:00:00+07:00",
  deadlinePendaftaran: "2026-11-19T23:59:00+07:00", kuota: 80, sisaKuota: 25,
};
const now = Date.parse("2026-11-01T00:00:00+07:00");

test("query parameters are bounded, allowlisted and preserve search across pagination", () => {
  const filters = eventFilters({ search: ["  web & design  ", "ignored"], kategori: "lomba", status: "upcoming", page: "2" });
  assert.equal(filters.search, "web & design");
  assert.equal(eventListHref(filters, { page: 3 }), "/events?search=web+%26+design&kategori=lomba&status=upcoming&page=3");
  assert.deepEqual(eventFilters({ page: "-1", kategori: "invalid", status: "draft" }), { search: "", kategori: "", status: "", page: 1 });
  assert.equal(eventFilters({ search: "a".repeat(200), page: "Infinity" }).search.length, 100);
});

test("draft and malformed records are never public", () => {
  assert.equal(normalizeEvent({ ...sample, status: "draft" }), null);
  assert.equal(normalizeEvent({ ...sample, slug: "../../admin" }), null);
  assert.equal(normalizeEvent({ ...sample, judul: "" }), null);
  assert.equal(normalizeEvent(null), null);
});

test("team quotas use team units and preserve zero versus unknown", () => {
  const event = normalizeEvent({ ...sample, tipe_pendaftaran: "tim", sisaKuota: 0, team_settings: { kuota_tim: 20, min_anggota: 3, max_anggota: 5 } });
  assert.equal(event.kuota, 20);
  assert.equal(event.sisaKuota, 0);
  assert.equal(event.minAnggota, 3);
  assert.equal(registrationState(event, now).label, "Kuota penuh");
  assert.equal(normalizeEvent({ ...sample, sisaKuota: null }).sisaKuota, null);
});

test("registration gates handle closed, ended, upcoming, deadline boundary and open", () => {
  const event = normalizeEvent(sample);
  assert.equal(registrationState(event, now).key, "open");
  assert.equal(registrationState({ ...event, status: "closed" }, now).key, "closed");
  assert.equal(registrationState(event, Date.parse(event.deadlinePendaftaran)).key, "closed");
  assert.equal(registrationState(event, Date.parse(event.tanggalSelesai)).key, "done");
  assert.equal(registrationState({ ...event, bukaPendaftaran: "2026-11-02T00:00:00+07:00" }, now).key, "soon");
});

test("unsafe image and registration URLs are rejected", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.example", "/\\evil.example", "https://user:secret@example.com"]) assert.equal(safeEventUrl(url), null);
  assert.equal(safeEventUrl("https://example.com/poster.webp"), "https://example.com/poster.webp");
  assert.equal(safeEventUrl("/images/poster.webp"), "/images/poster.webp");
});

test("dates use WIB independent of the server timezone", () => {
  assert.match(eventDate("2026-11-19T18:00:00Z", true), /20 November 2026/);
  assert.match(eventDate("2026-11-19T18:00:00Z", true), /WIB$/);
});
