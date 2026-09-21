export const EVENT_CATEGORIES = [
  ["", "Semua kategori"], ["lomba", "Lomba"], ["seminar", "Seminar"],
  ["workshop", "Workshop"], ["lainnya", "Lainnya"],
];
export const EVENT_STATUSES = [
  ["", "Semua waktu"], ["upcoming", "Akan datang"],
  ["ongoing", "Berlangsung"], ["selesai", "Selesai"],
];
const text = (value) => typeof value === "string" ? value.trim() : "";
const first = (value) => Array.isArray(value) ? value[0] : value;
const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
const date = (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;

export function eventFilters(params = {}) {
  const category = first(params.kategori);
  const status = first(params.status);
  const page = Number(first(params.page));
  return {
    search: text(first(params.search)).slice(0, 100),
    kategori: EVENT_CATEGORIES.some(([key]) => key === category) ? category : "",
    status: EVENT_STATUSES.some(([key]) => key === status) ? status : "",
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
  };
}

export function eventListHref(filters, overrides = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...overrides })) {
    if (value && !(key === "page" && value === 1)) query.set(key, String(value));
  }
  return `/events${query.size ? `?${query}` : ""}`;
}

export function safeEventUrl(value) {
  if (typeof value !== "string") return null;
  // Accept public absolute URLs or local paths; never protocol-relative URLs.
  if (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function normalizeEvent(raw) {
  if (!raw || typeof raw !== "object" || !["published", "closed", "selesai"].includes(raw.status)) return null;
  if (!text(raw.judul) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.slug || "")) return null;
  const team = raw.teamSettings ?? raw.team_settings ?? {};
  const isTeam = (raw.tipePendaftaran ?? raw.tipe_pendaftaran) === "tim";
  const strings = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
  return {
    id: raw.id ?? raw.slug, slug: raw.slug, judul: text(raw.judul),
    deskripsi: text(raw.deskripsi), kategori: EVENT_CATEGORIES.some(([key]) => key && key === raw.kategori) ? raw.kategori : "lainnya",
    poster: safeEventUrl(raw.poster), status: raw.status,
    tanggalMulai: date(raw.tanggalMulai ?? raw.tanggal_mulai),
    tanggalSelesai: date(raw.tanggalSelesai ?? raw.tanggal_selesai),
    deadlinePendaftaran: date(raw.deadlinePendaftaran ?? raw.deadline_pendaftaran),
    bukaPendaftaran: date(raw.bukaPendaftaran ?? raw.buka_pendaftaran),
    lokasi: text(raw.lokasi) || "Lokasi akan diumumkan",
    tipe: ["online", "offline", "hybrid"].includes(raw.tipe) ? raw.tipe : null,
    tipePendaftaran: isTeam ? "tim" : "individu",
    kuota: count(isTeam ? (team.kuotaTim ?? team.kuota_tim) : raw.kuota),
    sisaKuota: count(raw.sisaKuota ?? raw.sisa_kuota),
    minAnggota: count(team.minAnggota ?? team.min_anggota),
    maxAnggota: count(team.maxAnggota ?? team.max_anggota),
    syarat: strings(raw.syarat), hadiah: strings(raw.hadiah),
    registrationUrl: safeEventUrl(raw.registrationUrl ?? raw.registration_url),
  };
}

export function registrationState(event, now = Date.now()) {
  if (event.status === "selesai" || (event.tanggalSelesai && Date.parse(event.tanggalSelesai) <= now)) return { key: "done", label: "Event selesai", icon: "✓" };
  if (event.status === "closed" || (event.deadlinePendaftaran && Date.parse(event.deadlinePendaftaran) <= now)) return { key: "closed", label: "Pendaftaran ditutup", icon: "—" };
  if (event.sisaKuota === 0 || event.kuota === 0) return { key: "closed", label: "Kuota penuh", icon: "—" };
  if (event.bukaPendaftaran && Date.parse(event.bukaPendaftaran) > now) return { key: "soon", label: "Segera dibuka", icon: "◷" };
  if (!event.deadlinePendaftaran && !event.registrationUrl) return { key: "soon", label: "Info pendaftaran menyusul", icon: "◷" };
  return { key: "open", label: "Pendaftaran dibuka", icon: "●" };
}

export function eventDate(value, withTime = false) {
  if (!value) return "Jadwal akan diumumkan";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value)) + (withTime ? " WIB" : "");
}
