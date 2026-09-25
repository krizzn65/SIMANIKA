import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/lib/events.js", import.meta.url), "utf8");
const { eventFilters, eventListHref, safeEventUrl, normalizeEvent, registrationState, eventFeeLabel, eventDate, eventCategoryLabel } =
  await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const sample = {
  id: 1, slug: "workshop-web", judul: "Workshop Web", status: "published",
  tanggalMulai: "2026-11-20T09:00:00+07:00", tanggalSelesai: "2026-11-20T16:00:00+07:00",
  deadlinePendaftaran: "2026-11-19T23:59:00+07:00",
};
const now = Date.parse("2026-11-01T00:00:00+07:00");

test("query parameters are bounded, allowlisted and preserve search across pagination", () => {
  const filters = eventFilters({ search: ["  web & design  ", "ignored"], kategori: "hi-fest", status: "upcoming", page: "2" });
  assert.equal(filters.search, "web & design");
  assert.equal(eventListHref(filters, { page: 3 }), "/events?search=web+%26+design&kategori=hi-fest&status=upcoming&page=3");
  assert.deepEqual(eventFilters({ page: "-1", kategori: "invalid", status: "draft" }), { search: "", kategori: "", status: "", page: 1 });
  assert.equal(eventFilters({ search: "a".repeat(200), page: "Infinity" }).search.length, 100);
  assert.equal(eventCategoryLabel("hi-fest"), "HI-FEST");
  assert.equal(eventCategoryLabel("MIC"), "MIC");
  assert.equal(eventCategoryLabel("imce"), "IMCE");
  assert.equal(eventCategoryLabel("Komunitas"), "Komunitas");
  assert.equal(eventFilters({ kategori: "mic" }).kategori, "mic");
  assert.equal(eventFilters({ kategori: "imce" }).kategori, "imce");
});

test("draft and malformed records are never public", () => {
  assert.equal(normalizeEvent({ ...sample, status: "draft" }), null);
  assert.equal(normalizeEvent({ ...sample, slug: "../../admin" }), null);
  assert.equal(normalizeEvent({ ...sample, judul: "" }), null);
  assert.equal(normalizeEvent(null), null);
});

test("team settings normalize min and max members", () => {
  const event = normalizeEvent({ ...sample, tipe_pendaftaran: "tim", team_settings: { min_anggota: 3, max_anggota: 5 } });
  assert.equal(event.minAnggota, 3);
  assert.equal(event.maxAnggota, 5);
  assert.equal(registrationState(event, now).label, "Pendaftaran dibuka");
});


test("event payment normalizes and formats Free or Indonesian rupiah", () => {
  const free = normalizeEvent(sample);
  const paid = normalizeEvent({ ...sample, payment_type: "paid", htm: 500000 });
  assert.equal(free.paymentType, "free");
  assert.equal(eventFeeLabel(free), "Free");
  assert.equal(paid.paymentType, "paid");
  assert.equal(paid.htm, 500000);
  assert.match(eventFeeLabel(paid), /HTM · Rp\s?500[.]000/);
});

test("registration gates handle closed, ended, upcoming, deadline boundary and open", () => {
  const event = normalizeEvent(sample);
  assert.equal(registrationState(event, now).key, "open");
  assert.equal(registrationState({ ...event, status: "closed" }, now).key, "closed");
  assert.equal(registrationState(event, Date.parse(event.deadlinePendaftaran)).key, "closed");
  assert.equal(registrationState(event, Date.parse(event.tanggalSelesai)).key, "done");
  assert.equal(registrationState({ ...event, bukaPendaftaran: "2026-11-02T00:00:00+07:00" }, now).key, "soon");
});

test("latest batch dates gate registration for whole days and timeline follows date", () => {
  const event = normalizeEvent({ ...sample,
    bukaPendaftaran: "2026-11-10",
    deadlinePendaftaran: "2026-11-12",
    timeline: [
      { type: "registration_open", batch: 1, judul: "Pendaftaran", tanggal: "2026-11-10" },
      { type: "proposal", judul: "Pengumpulan Proposal", tanggal: "2026-11-09" },
      { type: "registration_close", batch: 1, judul: "Penutupan Pendaftaran", tanggal: "2026-11-12" },
    ],
  });
  assert.equal(event.timeline[0].type, "proposal");
  assert.equal(registrationState(event, Date.parse("2026-11-09T23:59:00+07:00")).key, "soon");
  assert.equal(registrationState(event, Date.parse("2026-11-10T00:01:00+07:00")).key, "open");
  assert.equal(registrationState(event, Date.parse("2026-11-12T20:01:00+07:00")).key, "open");
  assert.equal(registrationState(event, Date.parse("2026-11-13T00:01:00+07:00")).key, "closed");
});

test("unsafe image and registration URLs are rejected", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.example", "/\\evil.example", "https://user:secret@example.com"]) assert.equal(safeEventUrl(url), null);
  assert.equal(safeEventUrl("https://example.com/poster.webp"), "https://example.com/poster.webp");
  assert.equal(safeEventUrl("/images/poster.webp"), "/images/poster.webp");
});

test("dates format in Indonesian locale independent of the server timezone", () => {
  assert.match(eventDate("2026-11-19T18:00:00Z"), /20 November 2026/);
});
