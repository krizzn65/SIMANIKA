export const EVENT_CATEGORIES = [
  ["", "Semua kategori"], ["hi-fest", "HI-FEST"], ["mic", "MIC"],
  ["imce", "IMCE"], ["lainnya", "Lainnya"],
];
export function eventCategoryLabel(value) {
  const category = String(value || "").trim();
  const normalized = category.toLowerCase();
  return EVENT_CATEGORIES.find(([key]) => key === normalized)?.[1] || category || "Lainnya";
}

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
    deskripsi: text(raw.deskripsi), kategori: text(raw.kategori) || "lainnya",
    poster: safeEventUrl(raw.poster), guidebookUrl: safeEventUrl(raw.guidebookUrl), status: raw.status,
    tanggalMulai: date(raw.tanggalMulai ?? raw.tanggal_mulai),
    tanggalSelesai: date(raw.tanggalSelesai ?? raw.tanggal_selesai),
    deadlinePendaftaran: date(raw.deadlinePendaftaran ?? raw.deadline_pendaftaran),
    bukaPendaftaran: date(raw.bukaPendaftaran ?? raw.buka_pendaftaran),
    registrationBatch: count(raw.registrationBatch),
    registrationBatchCount: count(raw.registrationBatchCount),
    lokasi: text(raw.lokasi) || "Lokasi akan diumumkan",
    tipe: ["online", "offline", "hybrid"].includes(raw.tipe) ? raw.tipe : null,
    tipePendaftaran: isTeam ? "tim" : "individu",
    paymentType: (raw.paymentType ?? raw.payment_type) === "paid" ? "paid" : "free",
    htm: count(raw.htm),
    minAnggota: count(team.minAnggota ?? team.min_anggota),
    maxAnggota: count(team.maxAnggota ?? team.max_anggota),
    syarat: strings(raw.syarat), hadiah: strings(raw.hadiah),
    formFields: Array.isArray(raw.formFields) ? raw.formFields.filter((field) => field && typeof field.name === "string" && typeof field.label === "string" && typeof field.type === "string").map((field) => ({ ...field, options: Array.isArray(field.options) ? field.options : [] })) : [],
    timeline: Array.isArray(raw.timeline)
      ? raw.timeline
          .filter((t) => t && typeof t === "object" && text(t.judul) && date(t.tanggal))
          .map((t) => ({ judul: text(t.judul), tanggal: date(t.tanggal), type: text(t.type), batch: Number(t.batch) || null }))
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      : [],
  };
}

export function registrationState(event, now = Date.now()) {
  const parseDateEnd = (d) => {
    if (!d) return null;
    const str = typeof d === "string" && d.length === 10 ? `${d}T23:59:59.999+07:00` : d;
    return Date.parse(str);
  };
  const parseDateStart = (d) => {
    if (!d) return null;
    const str = typeof d === "string" && d.length === 10 ? `${d}T00:00:00.000+07:00` : d;
    return Date.parse(str);
  };

  const endMs = parseDateEnd(event.tanggalSelesai);
  if (event.status === "selesai" || (endMs && endMs <= now)) return { key: "done", label: "Event selesai", icon: "✓" };

  const deadlineMs = parseDateEnd(event.deadlinePendaftaran);
  if (event.status === "closed" || (deadlineMs && deadlineMs <= now)) return { key: "closed", label: "Pendaftaran ditutup", icon: "—" };

  const bukaMs = parseDateStart(event.bukaPendaftaran);
  if (bukaMs && bukaMs > now) return { key: "soon", label: "Segera dibuka", icon: "◷" };

  if (!event.deadlinePendaftaran && !event.formFields?.length) return { key: "soon", label: "Info pendaftaran menyusul", icon: "◷" };
  return { key: "open", label: "Pendaftaran dibuka", icon: "●" };
}


export function eventFeeLabel(event) {
  if (event?.paymentType !== "paid") return "Free";
  const amount = Number(event?.htm);
  if (!Number.isSafeInteger(amount) || amount <= 0) return "HTM belum ditentukan";
  return `HTM · ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)}`;
}

export function registrationDeadlineLabel(event) {
  return event?.registrationBatchCount > 1 && event?.registrationBatch > 0
    ? `Batas daftar Batch ${event.registrationBatch}`
    : "Batas daftar";
}

export function eventDate(value) {
  if (!value) return "Jadwal akan diumumkan";
  const dateObj = new Date(value);
  if (isNaN(dateObj.getTime())) return "Jadwal akan diumumkan";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(dateObj);
}
